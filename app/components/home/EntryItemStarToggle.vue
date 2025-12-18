<template>
  <q-checkbox
    color="primary"
    checked-icon="star"
    true-value="starred"
    :model-value="starred"
    false-value="unstarred"
    unchecked-icon="star_outline"
    indeterminate-icon="star_half"
    @update:model-value="store.toggleEntryStar(entry.id)"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  entry: { id: number };
}>();

const store = useEntryStore();
const starred = computed(() => store.entryStars[props.entry.id]);
</script>
