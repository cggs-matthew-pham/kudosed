<script lang="ts">
  import { onMount } from "svelte";
  import { user, addItem, loadCollection, getSingleDoc, addItemWithId, updateItem } from "$lib/firebaseService";
  import type { CustomUser } from "$lib/firebaseService";
  import { writable, type Writable } from "svelte/store";
  import type { DocumentData } from "firebase/firestore"; 

  let userData: CustomUser | null = null;
  let shareCode: string = '';
  let classes: Writable<DocumentData[]> = writable([]);

  onMount(() => {
    user.subscribe((u) => {
      userData = u;
      if (u) {
        loadStudentClasses(u.uid);
      }
    });
  });

  async function loadStudentClasses(studentId: string): Promise<void> {
      try {
          // Get the student record matching the studentId
          const studentRecord = await getSingleDoc("students", studentId);
          console.log('Student record loaded:', studentRecord); // Debugging log

          // Extract class IDs from the student record
          const classIds = studentRecord?.classes || [];

          // Load classes for the student
          const loadedClasses: DocumentData[] = [];
          for (const classId of classIds) {
              const classData = await getSingleDoc("classes", classId);
              if (classData) {
                  loadedClasses.push(classData);
              }
          }

          console.log('Classes loaded:', loadedClasses); // Debugging log
          classes.set(loadedClasses);
      } catch (error) {
          console.error('Error loading classes:', error); // Debugging log
      }
  }

  async function joinClass(): Promise<void> {
      const userVal = userData;
      if (userVal && shareCode.trim() !== '') {
          try {
              // Load classes to find the class with the share code
              const loadedClasses: DocumentData[] = await loadCollection("classes", "");
              const foundClass = loadedClasses.find(cls => cls.shareCode === shareCode);
              if (foundClass) {
                  let studentRecord;
                  try {
                      studentRecord = await getSingleDoc("students", userVal.uid);
                  } catch {
                      // If student record doesn't exist, create it
                      studentRecord = {
                          userId: userVal.uid,
                          classes: [],
                          email: userVal.email,
                          name: userVal.displayName
                      };
                      await addItemWithId("students", userVal.uid, studentRecord);
                      console.log('Created new student record:', studentRecord); // Debugging log
                  }

                  const classIds = studentRecord.classes || [];

                  if (!classIds.includes(foundClass.id)) {
                      classIds.push(foundClass.id);
                      const updatedStudentRecord = {
                          ...studentRecord,
                          classes: classIds // Update the classes array
                      };
                      console.log('Joining class:', updatedStudentRecord); // Debugging log
                      await updateItem("students", userVal.uid, updatedStudentRecord);
                      console.log('Joined class:', foundClass.name); // Debugging log
                      loadStudentClasses(userVal.uid);
                      shareCode = '';
                  } else {
                      console.error('Already joined this class');
                  }
              } else {
                  console.error('Class not found with the provided share code');
              }
          } catch (error) {
              console.error('Error joining class:', error); // Debugging log
          }
      }
  }
</script>

<h1>Student Dashboard</h1>

{#if userData}
<p>Welcome, {userData.displayName}!</p>
{:else}
<p>Welcome, student!</p>
{/if}

<form on:submit|preventDefault={joinClass}>
<input type="text" bind:value={shareCode} placeholder="Enter class share code">
<button type="submit">Join Class</button>
</form>

<h2>Your Classes</h2>
<ul>
{#each $classes as classItem}
  <li>{classItem.name}</li>
{/each}
</ul>

<style>
/* Add your styles here */
</style>
