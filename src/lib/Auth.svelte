<script lang="ts">
 
    import { user, logout, loginOrRegister } from "$lib/firebaseService";
    import { onMount } from "svelte";
    import type { CustomUser } from "$lib/firebaseService";
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
  </script>
  <div class="container">
  {#if userData}
    <button on:click={logout}>Logout</button>
  {:else}
    {#if registering}
      <div>
        <p>Select your role:</p>
        <button on:click={() => registerAs('teacher')}>Register as Teacher</button>
        <button on:click={() => registerAs('student')}>Register as Student</button>
      </div>
    {:else}
      <div>
        <button on:click={handleLogin}>Login with Google</button>
      </div>
    {/if}
  {/if}
</div>
  