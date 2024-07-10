<script lang="ts">
  import { onMount } from "svelte";
  import { user, loadCollection, addTaskAssignment, loadTaskAssignments, deleteTaskAssignment } from "$lib/firebaseService";
  import { writable, type Writable } from "svelte/store";
  import type { User } from "firebase/auth";
  import type { DocumentData } from "firebase/firestore";

  const tasks: Writable<DocumentData[]> = writable([]);
  const classes: Writable<DocumentData[]> = writable([]);
  const selectedTasks: Writable<Set<string>> = writable(new Set());
  const selectedClasses: Writable<Set<string>> = writable(new Set());
  const taskAssignments: Writable<DocumentData[]> = writable([]);
  const groupedAssignments: Writable<{ [classId: string]: string[] }> = writable({});

  onMount(() => {
    user.subscribe((u: User | null) => {
      console.log('User subscription:', u); // Debugging log
      if (u) {
        loadAllTasks(u.uid);
        loadAllClasses(u.uid);
        loadAllTaskAssignments(u.uid);
      }
    });
  });

  async function loadAllTasks(userId: string): Promise<void> {
    try {
      const loadedTasks: DocumentData[] = await loadCollection("tasks", userId);
      console.log('Tasks loaded:', loadedTasks); // Debugging log

      // Sort tasks alphabetically by name
      loadedTasks.sort((a, b) => a.name.localeCompare(b.name));

      tasks.set(loadedTasks);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error loading tasks:', error.message); // Detailed logging
      } else {
        console.error('Error loading tasks:', error); // Handle unexpected types
      }
    }
  }

  async function loadAllClasses(userId: string): Promise<void> {
    try {
      const loadedClasses: DocumentData[] = await loadCollection("classes", userId);
      console.log('Classes loaded:', loadedClasses); // Debugging log

      // Sort classes alphabetically by name
      loadedClasses.sort((a, b) => a.name.localeCompare(b.name));

      classes.set(loadedClasses);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error loading classes:', error.message); // Detailed logging
      } else {
        console.error('Error loading classes:', error); // Handle unexpected types
      }
    }
  }

  async function loadAllTaskAssignments(userId: string): Promise<void> {
    try {
      const loadedAssignments: DocumentData[] = await loadTaskAssignments(userId);
      console.log('Task assignments loaded:', loadedAssignments); // Debugging log
      taskAssignments.set(loadedAssignments);
      groupAssignmentsByClass(loadedAssignments);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error loading task assignments:', error.message); // Detailed logging
      } else {
        console.error('Error loading task assignments:', error); // Handle unexpected types
      }
    }
  }

  function groupAssignmentsByClass(assignments: DocumentData[]) {
    const grouped: { [classId: string]: string[] } = {};
    assignments.forEach(assignment => {
      if (!grouped[assignment.classId]) {
        grouped[assignment.classId] = [];
      }
      grouped[assignment.classId].push(...assignment.taskIds);
    });

    // Sort tasks within each class alphabetically by their names
    tasks.update(allTasks => {
      for (const classId in grouped) {
        grouped[classId].sort((a, b) => {
          const taskA = allTasks.find(task => task.id === a);
          const taskB = allTasks.find(task => task.id === b);
          return taskA && taskB ? taskA.name.localeCompare(taskB.name) : 0;
        });
      }
      return allTasks;
    });

    groupedAssignments.set(grouped);
  }

  function toggleSelection(setStore: Writable<Set<string>>, id: string) {
    setStore.update((currentSet) => {
      if (currentSet.has(id)) {
        currentSet.delete(id);
      } else {
        currentSet.add(id);
      }
      return new Set(currentSet);
    });
  }

  function tickAll(setStore: Writable<Set<string>>, items: DocumentData[]) {
    setStore.set(new Set(items.map(item => item.id)));
  }

  function clearAll(setStore: Writable<Set<string>>) {
    setStore.set(new Set());
  }

  async function assignTasks() {
    const userVal: User | null = $user;
    if (!userVal) {
      console.error("No user logged in");
      return;
    }

    const tasksToAssign = Array.from($selectedTasks);
    const classesToAssign = Array.from($selectedClasses);

    for (const classId of classesToAssign) {
      try {
        await addTaskAssignment(classId, tasksToAssign, userVal.uid);
        console.log(`Assigned tasks ${tasksToAssign} to class ${classId}`); // Debugging log
      } catch (error) {
        console.error(`Error assigning tasks ${tasksToAssign} to class ${classId}:`, error);
      }
    }

    loadAllTaskAssignments(userVal.uid);
  }

  async function removeTaskAssignment(classId: string, taskId: string) {
    try {
      await deleteTaskAssignment(classId, taskId);
      const userVal: User | null = $user;
      if (userVal) {
        loadAllTaskAssignments(userVal.uid);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error removing task assignment:', error.message); // Detailed logging
      } else {
        console.error('Error removing task assignment:', error); // Handle unexpected types
      }
    }
  }

  function getTaskName(taskId: string): string {
    const task = $tasks.find(task => task.id === taskId);
    return task ? task.name : "Unknown Task";
  }

  function getClassName(classId: string): string {
    const classItem = $classes.find(classItem => classItem.id === classId);
    return classItem ? classItem.name : "Unknown Class";
  }

  function getAssignmentId(taskId: string, classId: string): string | null {
    const assignment = $taskAssignments.find(
      (assignment) => assignment.taskIds.includes(taskId) && assignment.classId === classId
    );
    return assignment ? assignment.id : null;
  }
</script>

<main>
  <h1>Manage Allocations</h1>

  {#if $user}
    <!-- Tasks Section -->
    <section>
      <h2>Tasks</h2>
      <button on:click={() => tickAll(selectedTasks, $tasks)}>Tick All</button>
      <button on:click={() => clearAll(selectedTasks)}>Clear All</button>
      <ul>
        {#each $tasks as task}
          <li>
            <input type="checkbox" checked={$selectedTasks.has(task.id)} on:change={() => toggleSelection(selectedTasks, task.id)}>
            {task.name}
          </li>
        {/each}
      </ul>
    </section>

    <!-- Classes Section -->
    <section>
      <h2>Classes</h2>
      <button on:click={() => tickAll(selectedClasses, $classes)}>Tick All</button>
      <button on:click={() => clearAll(selectedClasses)}>Clear All</button>
      <ul>
        {#each $classes as classItem}
          <li>
            <input type="checkbox" checked={$selectedClasses.has(classItem.id)} on:change={() => toggleSelection(selectedClasses, classItem.id)}>
            {classItem.name}
          </li>
        {/each}
      </ul>
    </section>

    <!-- Assign Button -->
    <button on:click={assignTasks}>Assign</button>

    <!-- Task Assignments Section -->
    <section>
      <h2>Task Assignments</h2>
      {#each Object.keys($groupedAssignments).sort((a, b) => getClassName(a).localeCompare(getClassName(b))) as classId}
        <div>
          <strong>{getClassName(classId)}:</strong>
          {#each $groupedAssignments[classId] as taskId, index}
            {@const assignmentId = getAssignmentId(taskId, classId)}
            {getTaskName(taskId)}
            {#if assignmentId}
              <button on:click={() => removeTaskAssignment(classId, taskId)}>
                Remove
              </button>
            {/if}
            {#if index < $groupedAssignments[classId].length - 1}, {/if}
          {/each}
        </div>
      {/each}
    </section>
  {/if}
</main>

<style>
  section {
    margin-bottom: 1rem;
  }
  button {
    margin-right: 0.5rem;
  }
</style>
