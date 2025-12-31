<template>
  <q-checkbox
    color="accent"
    checked-icon="star"
    true-value="starred"
    false-value="unstarred"
    unchecked-icon="star_outline"
    indeterminate-icon="star_half"
    :model-value="store.entryStars[entry.id]"
    @update:model-value="toggleEntryStar()"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  entry: { id: number };
}>();

const store = useEntryStore();

async function toggleEntryStar() {
  const previous = store.entryStars[props.entry.id];
  const value = previous === "starred" ? "unstarred" : "starred";
  await store.setEntryStar(props.entry.id, value);
}
</script>
