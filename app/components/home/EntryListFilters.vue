<template>
  <q-list>
    <q-item-label header>Entry status</q-item-label>
    <q-item>
      <q-option-group
        v-model="store.status"
        type="radio"
        :options="STATUS"
        label="Entry status"
        @update:model-value="store.setStatus"
      />
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
const store = useEntryStore();
</script>
