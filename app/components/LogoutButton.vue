<template>
  <XButton class="p-2" variant="danger" @click="logout">Logout</XButton>
</template>

<script setup lang="ts">
const { clear: logout } = useUserSession();
</script>
