<template>
  <q-list padding>
    <q-item-label header>Entry Status</q-item-label>
    <q-item>
      <q-option-group :options="STATUS" :model-value="entryStatus" @update:model-value="setStatus" />
    </q-item>
  </q-list>
  <q-separator spaced />
</template>

<script setup lang="ts">
const { STATUS, entryStatus, setStatus } = useEntryState();
</script>
