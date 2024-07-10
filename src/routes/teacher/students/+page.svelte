<script lang="ts">
    import { onMount } from "svelte";
    import { user, loadCollection, addItem, updateItem, deleteItem } from "$lib/firebaseService";
    import { writable, type Writable } from "svelte/store";
    import type { User } from "firebase/auth";
    import type { DocumentData } from "firebase/firestore";

    import TextInput from "$lib/TextInput.svelte";
  import EmailInput from "$lib/EmailInput.svelte";
  
    const students: Writable<DocumentData[]> = writable([]);
    const classes: Writable<DocumentData[]> = writable([]);
  
    const attributes = [
      { key: 'name', label: 'Student Name', type: 'text' },
      { key: 'email', label: 'Student Email', type: 'email' },
      { key: 'class', label: 'Class', type: 'select' }
    ];
  
    let newStudent: Record<string, string> = {};
    let editingStudentId: string | null = null;
    let editingStudent: Record<string, string> = {};
  
    onMount(() => {
      user.subscribe((u: User | null) => {
        console.log('User subscription:', u); // Debugging log
        if (u) {
          loadAllStudents(u.uid);
          loadAllClasses(u.uid);
        }
      });
    });
  
    async function loadAllStudents(userId: string): Promise<void> {
      try {
        const loadedStudents: DocumentData[] = await loadCollection("students", userId);
        console.log('Students loaded:', loadedStudents); // Debugging log
        students.set(loadedStudents);
      } catch (error) {
        console.error('Error loading students:', error); // Debugging log
      }
    }
  
    async function loadAllClasses(userId: string): Promise<void> {
      try {
        const loadedClasses: DocumentData[] = await loadCollection("classes", userId);
        console.log('Classes loaded:', loadedClasses); // Debugging log
        classes.set(loadedClasses);
      } catch (error) {
        console.error('Error loading classes:', error); // Debugging log
      }
    }
  
    async function createStudent(): Promise<void> {
      const userVal: User | null = $user;
      if (userVal && Object.values(newStudent).every(value => value.trim() !== '')) {
        try {
          const newStudentData = { ...newStudent, userId: userVal.uid };
          console.log('Adding student:', newStudentData); // Debugging log
          await addItem("students", newStudentData);
          console.log('Student added:', newStudentData); // Debugging log
          loadAllStudents(userVal.uid);
          newStudent = {};
        } catch (error) {
          console.error('Error adding student:', error); // Debugging log
        }
      }
    }
  
    async function editStudent(student: DocumentData): Promise<void> {
      editingStudentId = student.id;
      editingStudent = { ...student };
    }
  
    async function updateStudentInfo(): Promise<void> {
      const userVal: User | null = $user;
      if (userVal && editingStudentId && Object.values(editingStudent).every(value => value.trim() !== '')) {
        try {
          const updatedStudent = { ...editingStudent, userId: userVal.uid };
          console.log('Updating student:', updatedStudent); // Debugging log
          await updateItem("students", editingStudentId, updatedStudent);
          console.log('Student updated:', updatedStudent); // Debugging log
          loadAllStudents(userVal.uid);
          editingStudentId = null;
          editingStudent = {};
        } catch (error) {
          console.error('Error updating student:', error); // Debugging log
        }
      }
    }
  
    async function removeStudent(studentId: string): Promise<void> {
      const userVal: User | null = $user;
      if (userVal) {
        try {
          console.log('Removing student:', studentId); // Debugging log
          await deleteItem("students", studentId);
          console.log('Student removed:', studentId); // Debugging log
          loadAllStudents(userVal.uid);
        } catch (error) {
          console.error('Error removing student:', error); // Debugging log
        }
      }
    }
  </script>
  
  <main>
    <h1>Manage Students</h1>
  
    {#if $user}
      
      <!-- Students List -->
      <h2>Students</h2>
      <ul>
        {#each $students as student}
          <li>
            {#if editingStudentId === student.id}
              {#each attributes as attribute}  
                {#if attribute.type === 'text'}
                    <TextInput bind:value={editingStudent[attribute.key]} placeholder={"Edit " + attribute.label} />
                {:else if attribute.type === 'email'}
                    <EmailInput bind:value={editingStudent[attribute.key]} placeholder={"Edit " + attribute.label} />
                {:else if attribute.type === 'select'}
                  <select bind:value={editingStudent[attribute.key]}>
                    <option value="" disabled>Select {attribute.label}</option>
                    {#each $classes as classItem}
                      <option value={classItem.id}>{classItem.name}</option>
                    {/each}
                  </select>
                {/if}
              {/each}
              <button on:click={updateStudentInfo}>Update</button>
              <button on:click={() => { editingStudentId = null; editingStudent = {}; }}>Cancel</button>
            {:else}
              {#each attributes as attribute}
                {#if attribute.type === 'select'}
                  {#each $classes as classItem}
                    {#if classItem.id === student[attribute.key]}
                      {classItem.name}
                    {/if}
                  {/each}
                {:else}
                  {student[attribute.key]}
                {/if}
                {#if attribute !== attributes[attributes.length - 1]}, {/if}
              {/each}
              <button on:click={() => editStudent(student)}>Edit</button>
              <button on:click={() => removeStudent(student.id)}>Delete</button>
            {/if}
          </li>
        {/each}
      </ul>
  
      <!-- Add Student Form -->
      <form on:submit|preventDefault={createStudent}>
        {#each attributes as attribute}
        {#if attribute.type === 'text'}
        <TextInput bind:value={newStudent[attribute.key]} placeholder={"Enter " + attribute.label} />
      {:else if attribute.type === 'email'}
        <EmailInput bind:value={newStudent[attribute.key]} placeholder={"Enter " + attribute.label} />
          
          {:else if attribute.type === 'select'}
            <select bind:value={newStudent[attribute.key]}>
              <option value="" disabled>Select {attribute.label}</option>
              {#each $classes as classItem}
                <option value={classItem.id}>{classItem.name}</option>
              {/each}
            </select>
          {/if}
        {/each}
        <button type="submit">Add Student</button>
      </form>

    {/if}
  </main>
  