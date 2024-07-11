<script lang="ts">
  import { onMount } from "svelte";
  import { user, loadCollection, updateItem, getSingleDoc, loadTaskAssignments } from "$lib/firebaseService";
  import type { CustomUser } from "$lib/firebaseService";
  import { writable, type Writable } from "svelte/store";
  import type { DocumentData } from "firebase/firestore";

  let userData: CustomUser | null = null;
  let tasksByClass: Writable<{ [key: string]: DocumentData[] }> = writable({});
  let taskCompletion: Writable<{ [key: string]: boolean }> = writable({});
  let classes: Writable<DocumentData[]> = writable([]);

  onMount(() => {
    user.subscribe((u) => {
      userData = u;
      if (u) {
        loadAssignedTasks(u.uid);
        loadAllClasses();
      }
    });
  });

  async function loadAssignedTasks(studentId: string): Promise<void> {
      try {
          // Get the student record matching the studentId
          const studentRecord = await getSingleDoc("students", studentId);
          console.log('Student record loaded:', studentRecord); // Debugging log

          // Extract class IDs from the student record
          const classIds = studentRecord.classes || [];

          // Load tasks for all classes
          const tasksByClassData: { [key: string]: DocumentData[] } = {};
          for (const classId of classIds) {
              // Get the task assignments for the class ID
              const taskAssignments = await loadTaskAssignments("", classId);
              if (taskAssignments.length === 0) {
                  console.error(`No task assignments found for the class ID: ${classId}`);
                  continue;
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

              tasksByClassData[classId] = loadedTasks;
          }

          console.log('Tasks by class loaded:', tasksByClassData); // Debugging log
          tasksByClass.set(tasksByClassData);

          // Initialize taskCompletion if not exists
          const taskCompletionData = studentRecord.taskCompletion || {};
          for (const classId in tasksByClassData) {
              tasksByClassData[classId].forEach(task => {
                  if (!(task.id in taskCompletionData)) {
                      taskCompletionData[task.id] = false;
                  }
              });
          }

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

  async function loadAllClasses(): Promise<void> {
      try {
          const loadedClasses: DocumentData[] = await loadCollection("classes");
          console.log('Classes loaded:', loadedClasses); // Debugging log
          classes.set(loadedClasses);
      } catch (error) {
          console.error('Error loading classes:', error); // Debugging log
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

  function getClassName(classId: string): string {
      const classItem = $classes.find(classItem => classItem.id === classId);
      return classItem ? classItem.name : "Unknown Class";
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
  {#each Object.keys($tasksByClass) as classId}
      <h3>{getClassName(classId)}</h3>
      <div>
          {#each $tasksByClass[classId] as task}
              <div>
                  <input type="checkbox" checked={$taskCompletion[task.id] || false} on:change={() => updateTaskCompletion(task.id, !$taskCompletion[task.id])}>
                  {task.name}
              </div>
          {/each}
      </div>
  {/each}
</div>

<style>
/* Add your styles here */
h3 {
  margin-top: 1rem;
}
</style>
