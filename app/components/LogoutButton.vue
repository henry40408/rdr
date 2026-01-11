<template>
  <button class="bg-red-600 text-white p-2 hover:bg-red-700 hover:cursor-pointer" @click="logout">Logout</button>
</template>

<script setup lang="ts">
const { clear: logout } = useUserSession();
</script>
