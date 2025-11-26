<template>
  <q-tabs shrink>
    <q-route-tab to="/" label="Home" />
    <AuthenticatedFeedsTab v-if="loggedIn" />
    <q-route-tab v-else to="/feeds" label="Feeds" />
    <q-route-tab to="/settings" label="Settings" />
  </q-tabs>
</template>

<script setup lang="ts">
const { loggedIn } = useUserSession();
</script>
