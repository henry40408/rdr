<template>
  <q-list>
    <q-item-label header>Administration: User management</q-item-label>
    <SettingsUserItem v-for="user in store.users" :key="user.id" :user="user" />
  </q-list>
</template>

<script setup lang="ts">
const store = useUserStore();
</script>
