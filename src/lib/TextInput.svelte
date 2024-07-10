<script lang="ts">
    export let value = "";
    export let placeholder = "";
  
    function handleInput(event: Event) {
      value = (event.target as HTMLInputElement).value;
    }
</script>
  
<input type="text" bind:value={value} placeholder={placeholder} on:input={handleInput} />
  