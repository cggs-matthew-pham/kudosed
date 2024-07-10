<script lang="ts">

    import RoleBasedAccess from "$lib/RoleBasedAccess.svelte";
  </script>
  
  <RoleBasedAccess role="student">
    <slot />
  </RoleBasedAccess>
  