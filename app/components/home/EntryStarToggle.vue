<template>
  <q-checkbox
    checked-icon="star"
    :disable="starring"
    true-value="starred"
    false-value="unstarred"
    :model-value="entryStar"
    indeterminate-icon="refresh"
    unchecked-icon="star_border"
    @update:model-value="onModelUpdate()"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  entryId: number;
}>();

const { refresh: refreshCategories } = useCategories();
const { refresh: refreshEntryCount } = useEntryCount();
const { entryStars, toggleEntryStar } = useEntryState();

const entryStar = computed(() => entryStars.value[props.entryId]);
const starring = computed(() => entryStars.value[props.entryId] === "starring");

async function onModelUpdate() {
  await toggleEntryStar(props.entryId);
  await Promise.all([refreshCategories(), refreshEntryCount()]);
}
</script>
