<template>
  <q-checkbox
    color="grey"
    true-value="read"
    false-value="unread"
    checked-icon="drafts"
    unchecked-icon="mail"
    indeterminate-icon="mark_email_unread"
    :model-value="store.entryReads[entry.id]"
    @update:model-value="store.toggleEntryRead(entry.id)"
  />
</template>

<script setup lang="ts">
defineProps<{
  entry: { id: number };
}>();

const store = useEntryStore();
</script>
