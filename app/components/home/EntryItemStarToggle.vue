<template>
  <q-checkbox
    color="accent"
    checked-icon="star"
    true-value="starred"
    false-value="unstarred"
    unchecked-icon="star_outline"
    indeterminate-icon="star_half"
    :model-value="store.entryStars[entry.id]"
    @update:model-value="store.setEntryStar(entry.id, 'toggle')"
  />
</template>

<script setup lang="ts">
defineProps<{
  entry: { id: number };
}>();

const store = useEntryStore();
</script>
