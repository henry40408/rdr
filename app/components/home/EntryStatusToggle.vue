<template>
  <q-checkbox
    dense
    true-value="read"
    :disable="reading"
    false-value="unread"
    checked-icon="drafts"
    unchecked-icon="mail"
    :model-value="entryRead"
    @update:model-value="toggleEntryRead(entryId)"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  entryId: number;
}>();

const { entryReads, toggleEntryRead } = useEntryState();
const entryRead = computed(() => entryReads.value[props.entryId]);
const reading = computed(() => entryReads.value[props.entryId] === "reading");
</script>
