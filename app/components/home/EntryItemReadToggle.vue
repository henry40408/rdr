<template>
  <q-checkbox
    dense
    color="primary"
    true-value="read"
    :model-value="read"
    false-value="unread"
    checked-icon="drafts"
    unchecked-icon="mail"
    indeterminate-icon="mark_email_unread"
    @update:model-value="store.toggleEntryRead(entry.id)"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  entry: { id: number };
}>();

const store = useEntryStore();
const read = computed(() => store.entryReads[props.entry.id]);
</script>
