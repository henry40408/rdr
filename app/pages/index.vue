<template>
  <AuthenticatedHome v-if="loggedIn" />
  <LoginPage v-else @authenticated="fetchSession" />
</template>

<script setup lang="ts">
const { loggedIn, fetch: fetchSession } = useUserSession();
</script>
