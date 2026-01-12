<template>
  <button class="p-2 hover:cursor-pointer" @click="logout">Logout</button>
</template>

<script setup lang="ts">
const { clear: logout } = useUserSession();
</script>
