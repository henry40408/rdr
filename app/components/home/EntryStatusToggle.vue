<template>
  <q-checkbox
    dense
    true-value="read"
    :disable="reading"
    false-value="unread"
    checked-icon="drafts"
    unchecked-icon="mail"
    :model-value="entryRead"
    @update:model-value="onModelUpdate()"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  entryId: number;
}>();

const { refresh: refreshCategories } = useCategories();
const { refresh: refreshEntryCount } = useEntryCount();
const { entryReads, toggleEntryRead } = useEntryState();

const entryRead = computed(() => entryReads.value[props.entryId]);
const reading = computed(() => entryReads.value[props.entryId] === "reading");

async function onModelUpdate() {
  await toggleEntryRead(props.entryId);
  await Promise.all([refreshCategories(), refreshEntryCount()]);
}
</script>
