<template>
  <q-list>
    <q-item-label header>User Management</q-item-label>
    <SettingsUserItem v-for="user in users" :key="user.id" :user="user" />
  </q-list>
</template>

<script setup lang="ts">
const { data } = await useFetch("/api/users");

const users = computed(() => data.value?.users ?? []);
</script>
