<script lang="ts">
    import { onMount } from "svelte";
    import { user, loadCollection, addItem, updateItem, deleteItem } from "$lib/firebaseService";
    import { writable, type Writable } from "svelte/store";
    import type { User } from "firebase/auth";
    import type { DocumentData } from "firebase/firestore";
  
    const tasks: Writable<DocumentData[]> = writable([]);
    let newTask: string = '';
    let editingTaskId: string | null = null;
    let editingTask: string = '';
  
    onMount(() => {
      user.subscribe((u: User | null) => {
        console.log('User subscription:', u); // Debugging log
        if (u) {
          loadTasks(u.uid);
        }
      });
    });
  
    async function loadTasks(userId: string): Promise<void> {
      try {
        const loadedTasks: DocumentData[] = await loadCollection("tasks", userId);
        console.log('Tasks loaded:', loadedTasks); // Debugging log
        tasks.set(loadedTasks);
      } catch (error) {
        console.error('Error loading tasks:', error); // Debugging log
      }
    }
  
    async function createTask(): Promise<void> {
      const userVal: User | null = $user;
      if (userVal && newTask.trim() !== '') {
        try {
          console.log('Adding task for user:', userVal.uid); // Debugging log
          const newItem = {
            userId: userVal.uid, // Add userId field
            name: newTask,
            created: new Date()
          };
          console.log('New task item:', newItem); // Debugging log
          await addItem("tasks", newItem);
          console.log('Task added:', newTask); // Debugging log
          loadTasks(userVal.uid);
          newTask = '';
        } catch (error) {
          console.error('Error adding task:', error); // Debugging log
        }
      }
    }
  
    async function editTask(task: DocumentData): Promise<void> {
      editingTaskId = task.id;
      editingTask = task.name;
    }
  
    async function updateTask(): Promise<void> {
      const userVal: User | null = $user;
      if (userVal && editingTaskId && editingTask.trim() !== '') {
        try {
          console.log('Updating task for user:', userVal.uid); // Debugging log
          const updatedItem = {
            userId: userVal.uid, // Add userId field
            task: editingTask,
            updated: new Date()
          };
          console.log('Updated task item:', updatedItem); // Debugging log
          await updateItem("tasks", editingTaskId, updatedItem);
          console.log('Task updated:', editingTask); // Debugging log
          loadTasks(userVal.uid);
          editingTaskId = null;
          editingTask = '';
        } catch (error) {
          console.error('Error updating task:', error); // Debugging log
        }
      }
    }
  
    async function removeTask(taskId: string): Promise<void> {
      const userVal: User | null = $user;
      if (userVal) {
        try {
          console.log('Removing task for user:', userVal.uid); // Debugging log
          await deleteItem("tasks", taskId);
          console.log('Task removed:', taskId); // Debugging log
          loadTasks(userVal.uid);
        } catch (error) {
          console.error('Error removing task:', error); // Debugging log
        }
      }
    }
  </script>
  
  <main>
    <h1>To-Do List</h1>
  
    {#if $user}
      <!-- Task List -->
      <ul>
        {#each $tasks as task}
          <li>
            {#if editingTaskId === task.id}
              <input type="text" bind:value={editingTask} placeholder="Edit task">
              <button on:click={updateTask}>Update</button>
              <button on:click={() => { editingTaskId = null; editingTask = ''; }}>Cancel</button>
            {:else}
              {task.name}
              <button on:click={() => editTask(task)}>Edit</button>
              <button on:click={() => removeTask(task.id)}>Delete</button>
            {/if}
          </li>
        {/each}
      </ul>
  
      <!-- Add Task Form -->
      <form on:submit|preventDefault={createTask}>
        <input type="text" bind:value={newTask} placeholder="Enter a new task">
        <button type="submit">Add Task</button>
      </form>
    {/if}
  </main>
  