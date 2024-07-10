<script lang="ts">
    import { onMount } from "svelte";
    import { user, loadCollection, getSingleDoc, loadTaskAssignments } from "$lib/firebaseService";
    import { writable, type Writable } from "svelte/store";
    import type { User } from "firebase/auth";
    import type { DocumentData } from "firebase/firestore";
  
    const classes: Writable<DocumentData[]> = writable([]);
    const students: Writable<{ [classId: string]: DocumentData[] }> = writable({});
    const tasks: Writable<{ [classId: string]: DocumentData[] }> = writable({});
    const taskAssignments: Writable<{ [classId: string]: string[] }> = writable({});
  
    onMount(() => {
      user.subscribe((u: User | null) => {
        if (u) {
          loadAllClasses(u.uid);
        }
      });
    });
  
    async function loadAllClasses(userId: string): Promise<void> {
      try {
        const loadedClasses: DocumentData[] = await loadCollection("classes", userId);
        classes.set(loadedClasses);
  
        // Load students and tasks for each class
        loadedClasses.forEach(async (classItem) => {
          const classId = classItem.id;
  
          // Load students for the class
          const loadedStudents: DocumentData[] = await loadCollection("students", userId, "class", classId);
          students.update(s => {
            s[classId] = loadedStudents;
            return s;
          });
  
          // Load task assignments for the class
          const taskAssignmentsForClass = await loadTaskAssignments("", classId);
          if (taskAssignmentsForClass.length > 0) {
            const taskIds = taskAssignmentsForClass[0].taskIds;
            taskAssignments.update(t => {
              t[classId] = taskIds;
              return t;
            });
  
            // Load tasks based on the task IDs
            const loadedTasks: DocumentData[] = [];
            for (const taskId of taskIds) {
              const task = await getSingleDoc("tasks", taskId);
              if (task) {
                loadedTasks.push({ id: taskId, ...task });
              }
            }
            tasks.update(t => {
              t[classId] = loadedTasks;
              return t;
            });
          }
        });
  
      } catch (error) {
        console.error('Error loading classes:', error);
      }
    }
  
    function isTaskCompleted(taskCompletion: Record<string, boolean>, taskId: string): boolean {
      return taskCompletion[taskId] || false;
    }
  </script>
  
  <main>
    <h1>Class Progress</h1>
  
    {#each $classes as classItem}
      <section>
        <h2>{classItem.name}</h2>
        {#if $students[classItem.id] && $tasks[classItem.id]}
          <table>
            <thead>
              <tr>
                <th>Task</th>
                {#each $students[classItem.id] as student}
                  <th>{student.name}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each $tasks[classItem.id] as task}
                <tr>
                  <td>{task.name}</td>
                  {#each $students[classItem.id] as student}
                    <td>
                      <input type="checkbox" disabled checked={isTaskCompleted(student.taskCompletion, task.id)} />
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        {:else}
          <p>Loading data...</p>
        {/if}
      </section>
    {/each}
  </main>
  
  <style>
    section {
      margin-bottom: 2rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 8px;
      text-align: center;
    }
    th {
      background-color: #f4f4f4;
    }
  </style>
  