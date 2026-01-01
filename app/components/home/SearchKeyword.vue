<template>
  <q-chip v-if="store.search" outline removable @remove="store.search = ''">
    <q-avatar color="accent" text-color="white">
      <q-icon name="search" />
    </q-avatar>
    Search: {{ store.search }}
  </q-chip>
</template>

<script setup lang="ts">
const store = useEntryStore();
</script>
