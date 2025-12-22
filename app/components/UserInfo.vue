<template>
  <q-list>
    <q-item-label header>Account</q-item-label>
    <q-item v-if="session?.user">
      <q-item-section>
        <q-item-label caption>Username</q-item-label>
        <q-item-label>{{ session.user.username }}</q-item-label>
      </q-item-section>
    </q-item>
    <q-item v-if="session?.loggedInAt">
      <q-item-section>
        <q-item-label caption>Logged in at</q-item-label>
        <q-item-label><DateTime :datetime="session.loggedInAt" /></q-item-label>
      </q-item-section>
    </q-item>
    <q-item>
      <q-item-section>
        <q-btn label="Log Out" color="negative" @click="logout()" />
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
const { session, clear: logout } = useUserSession();
</script>
