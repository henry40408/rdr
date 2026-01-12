<template>
  <button class="p-2 hover:cursor-pointer bg-red-500 text-white hover:bg-red-400" @click="logout">Logout</button>
</template>

<script setup lang="ts">
const { clear: logout } = useUserSession();
</script>
