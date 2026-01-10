<template>
  <button class="bg-red-600 text-white p-2 rounded hover:bg-red-700" @click="logout">Logout</button>
</template>

<script setup lang="ts">
const { clear: logout } = useUserSession();
</script>
