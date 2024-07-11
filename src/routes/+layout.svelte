
<script lang="ts">
  import '../app.css';
  import { onMount } from "svelte";
  import { user, loginOrRegister, logout } from "$lib/firebaseService";
  import type { CustomUser } from "$lib/firebaseService";
  import NavBar from "$lib/NavBar.svelte"; // Existing Navbar for teachers
  import StudentNavBar from "$lib/StudentNavBar.svelte"; // New Navbar for students
  import { writable } from "svelte/store";

  let userData: CustomUser | null = null;
  let registering = false;
  const role = writable<string | null>(null);

  onMount(() => {
    user.subscribe((u) => {
      userData = u;
      if (u && u.role === 'unknown') {
        registering = true;
      }
    });
  });

  async function handleLogin() {
    await loginOrRegister();
  }

  async function registerAs(role: string) {
    await loginOrRegister(role);
    registering = false;
  }

  function handleLogout() {
    logout();
  }
</script>
<div class="container">


{#if userData}
  {#if registering}
    <div>
      <p>Select your role:</p>
      <button on:click={() => registerAs('teacher')}>Register as Teacher</button>
      <button on:click={() => registerAs('student')}>Register as Student</button>
    </div>
  {:else}
    {#if userData.role === 'teacher'}
      <NavBar />
    {:else if userData.role === 'student'}
      <StudentNavBar />
    {/if}
    <button on:click={handleLogout}>Logout</button>
  {/if}
  <slot />

{:else}
  <div>
    <button on:click={handleLogin}>Login with Google</button>
  </div>

{/if}
</div>

  
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@picocss/pico@2.0.6/css/pico.classless.min.css" />