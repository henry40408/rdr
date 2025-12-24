<template>
  <q-list>
    <q-item-label header>Administration: Job management</q-item-label>
    <SettingsJobItem v-for="job in store.jobs" :key="job.id" :job="job" />
  </q-list>
</template>

<script setup lang="ts">
const store = useJobStore();
</script>
