<script lang="ts">
    import { onMount } from "svelte";
    import { user, loadCollection, updateItem, getSingleDoc, loadTaskAssignments } from "$lib/firebaseService";
    import type { CustomUser } from "$lib/firebaseService";
    import { writable, type Writable } from "svelte/store";
    import type { DocumentData } from "firebase/firestore";
  
    let userData: CustomUser | null = null;
    let tasks: Writable<DocumentData[]> = writable([]);
    let taskCompletion: Writable<{ [key: string]: boolean }> = writable({});
  
    onMount(() => {
      user.subscribe((u) => {
        userData = u;
        if (u) {
          loadAssignedTasks(u.uid);
        }
      });
    });
  
    async function loadAssignedTasks(studentId: string): Promise<void> {
  try {
    // Get the student record matching the studentId
    const studentRecord = await getSingleDoc("students", studentId);
    console.log('Student record loaded:', studentRecord); // Debugging log

    // Extract class ID from the student record
    const classId = studentRecord.class;

    if (!classId) {
      console.error('No class ID found in student record');
      return;
    }

    // Get the task assignments for the class ID
    const taskAssignments = await loadTaskAssignments("", classId);
    if (taskAssignments.length === 0) {
      console.error('No task assignments found for the class ID');
      return;
    }

    // Get task IDs from the task assignment
    const taskIds = taskAssignments[0].taskIds;

    // Load the tasks
    const loadedTasks: DocumentData[] = [];
    for (const taskId of taskIds) {
      const task = await getSingleDoc("tasks", taskId);
      if (task) {
        loadedTasks.push({ id: taskId, ...task });
      }
    }

    console.log('Assigned tasks loaded:', loadedTasks); // Debugging log
    tasks.set(loadedTasks);

    // Initialize taskCompletion if not exists
    const taskCompletionData = studentRecord.taskCompletion || {};
    loadedTasks.forEach(task => {
      if (!(task.id in taskCompletionData)) {
        taskCompletionData[task.id] = false;
      }
    });

    // Update the student's taskCompletion in the database if necessary
    if (userData) {
      const updatedStudentRecord = { ...studentRecord, taskCompletion: taskCompletionData };
      await updateItem("students", userData.uid, updatedStudentRecord);
    }

    taskCompletion.set(taskCompletionData);

  } catch (error) {
    console.error('Error loading assigned tasks:', error); // Debugging log
  }
}

  
    async function updateTaskCompletion(taskId: string, completed: boolean): Promise<void> {
      try {
        const currentTaskCompletion = $taskCompletion;
        currentTaskCompletion[taskId] = completed;
        taskCompletion.set(currentTaskCompletion);
  
        if (userData) {
          const studentRecord = await getSingleDoc("students", userData.uid);
          if (studentRecord) {
            studentRecord.taskCompletion = currentTaskCompletion;
            await updateItem("students", userData.uid, studentRecord);
            console.log(`Task ${taskId} completion updated to ${completed}`); // Debugging log
          }
        }
      } catch (error) {
        console.error('Error updating task completion:', error); // Debugging log
      }
    }
  </script>
  
  <h1>Student Tasks</h1>
  
  {#if userData}
    <p>Welcome, {userData.displayName}!</p>
  {:else}
    <p>Welcome, student!</p>
  {/if}
  
  <h2>Your Tasks</h2>
  <div>
    {#each $tasks as task}
      <div>
        <input type="checkbox" checked={$taskCompletion[task.id] || false} on:change={() => updateTaskCompletion(task.id, !$taskCompletion[task.id])}>
        {task.name}
      </div>
    {/each}
    </div>
  
  <style>
    ul {
      list-style-type: none;
      padding: 0;
    }
    li {
      margin-bottom: 0.5rem;
    }
  </style>
  