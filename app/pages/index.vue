<template>
  <AuthenticatedHome v-if="loggedIn" />
  <LoginPage v-else />
</template>

<script setup lang="ts">
const { loggedIn } = useUserSession();
</script>
