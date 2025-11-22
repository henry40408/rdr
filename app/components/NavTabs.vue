<template>
  <q-tabs shrink>
    <q-route-tab to="/" label="Home" />
    <q-route-tab to="/feeds" label="Feeds">
      <q-badge v-if="loggedIn" floating color="negative">
        <AuthenticatedErrorFeedCount />
      </q-badge>
    </q-route-tab>
    <q-route-tab to="/settings" label="Settings" />
  </q-tabs>
</template>

<script setup>
const { loggedIn } = useUserSession();
</script>
