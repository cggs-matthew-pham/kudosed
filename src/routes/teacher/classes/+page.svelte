<script lang="ts">
  import { onMount } from "svelte";
  import { user, loadCollection, addItem, updateItem, deleteItem } from "$lib/firebaseService";
  import { writable, type Writable } from "svelte/store";
  import type { User } from "firebase/auth";
  import type { DocumentData } from "firebase/firestore";

  const classes: Writable<DocumentData[]> = writable([]);
  let newClassName: string = '';
  let editingClassId: string | null = null;
  let editingClassName: string = '';
  let newClassShareCode: string = '';

  function generateShareCode(length: number = 6): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  onMount(() => {
    user.subscribe((u: User | null) => {
      console.log('User subscription:', u); // Debugging log
      if (u) {
        loadAllClasses(u.uid);
      }
    });
  });

  async function loadAllClasses(userId: string): Promise<void> {
    try {
      const loadedClasses: DocumentData[] = await loadCollection("classes", userId);
      console.log('Classes loaded:', loadedClasses); // Debugging log
      classes.set(loadedClasses);
    } catch (error) {
      console.error('Error loading classes:', error); // Debugging log
    }
  }

  async function createClass(): Promise<void> {
    const userVal: User | null = $user;
    if (userVal && newClassName.trim() !== '') {
      try {
        const shareCode = generateShareCode();
        const newClass = { name: newClassName, userId: userVal.uid, shareCode };
        console.log('Adding class:', newClass); // Debugging log
        await addItem("classes", newClass);
        console.log('Class added:', newClassName, shareCode); // Debugging log
        loadAllClasses(userVal.uid);
        newClassName = '';
        newClassShareCode = shareCode; // Store the share code to display it
      } catch (error) {
        console.error('Error adding class:', error); // Debugging log
      }
    }
  }

  async function editClass(classItem: DocumentData): Promise<void> {
    editingClassId = classItem.id;
    editingClassName = classItem.name;
  }

  async function updateClassInfo(): Promise<void> {
    const userVal: User | null = $user;
    if (userVal && editingClassId && editingClassName.trim() !== '') {
      try {
        const updatedClass = { name: editingClassName, userId: userVal.uid };
        console.log('Updating class:', updatedClass); // Debugging log
        await updateItem("classes", editingClassId, updatedClass);
        console.log('Class updated:', editingClassName); // Debugging log
        loadAllClasses(userVal.uid);
        editingClassId = null;
        editingClassName = '';
      } catch (error) {
        console.error('Error updating class:', error); // Debugging log
      }
    }
  }

  async function removeClass(classId: string): Promise<void> {
    const userVal: User | null = $user;
    if (userVal) {
      try {
        console.log('Removing class:', classId); // Debugging log
        await deleteItem("classes", classId);
        console.log('Class removed:', classId); // Debugging log
        loadAllClasses(userVal.uid);
      } catch (error) {
        console.error('Error removing class:', error); // Debugging log
      }
    }
  }
</script>

<main>
  <h1>Manage Classes</h1>

  {#if $user}
    <!-- Classes List -->
    <h2>Classes</h2>
    <ul>
      {#each $classes as classItem}
        <li>
          {#if editingClassId === classItem.id}
            <input type="text" bind:value={editingClassName} placeholder="Edit class name">
            <button on:click={updateClassInfo}>Update</button>
            <button on:click={() => { editingClassId = null; editingClassName = ''; }}>Cancel</button>
          {:else}
            {classItem.name} (Share Code: {classItem.shareCode})
            <button on:click={() => editClass(classItem)}>Edit</button>
            <button on:click={() => removeClass(classItem.id)}>Delete</button>
          {/if}
        </li>
      {/each}
    </ul>

    <!-- Add Class Form -->
    <form on:submit|preventDefault={createClass}>
      <input type="text" bind:value={newClassName} placeholder="Enter a new class name">
      <button type="submit">Add Class</button>
    </form>

    {#if newClassShareCode}
      <p>New class share code: {newClassShareCode}</p>
    {/if}
  {/if}
</main>
