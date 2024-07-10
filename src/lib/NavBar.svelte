<script lang="ts">
    import { goto } from '$app/navigation';
  
    function navigateTo(route: string) {
      goto(route);
    }
  </script>
  
  <nav>
    <ul>
      <li><a href="/teacher/classes">Classes</a></li>
      <li><a href="/teacher/tasks">Tasks</a></li>
      <li><a href="/teacher/allocations">Allocations</a></li>
      <li><a href="/teacher/progress">Student Progress</a></li>
    </ul>
  </nav>
  
  <style>
  
  </style>
  