<script lang="ts">
  import { onMount } from "svelte";
  import { user } from "$lib/firebaseService";
  import type { CustomUser } from "$lib/firebaseService";

  export let role: string;
  let userData: CustomUser | null = null;

  onMount(() => {
    user.subscribe((u) => {
      userData = u;
    });
  });
</script>

{#if userData && userData.role === role}
  <slot />
{:else}
  <p>You do not have access to this page.</p>
{/if}
