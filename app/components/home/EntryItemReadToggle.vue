<template>
  <q-checkbox
    color="grey"
    true-value="read"
    false-value="unread"
    checked-icon="drafts"
    unchecked-icon="mail"
    indeterminate-icon="mark_email_unread"
    :model-value="store.entryReads[entry.id]"
    @update:model-value="updateModelValue"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  entry: { id: number };
}>();

const emit = defineEmits<{
  (e: "after-read"): void;
}>();

const store = useEntryStore();

async function updateModelValue(value: "unread" | "read" | "toggle") {
  await store.setEntryRead(props.entry.id, value);
  if (store.entryReads[props.entry.id] === "read") emit("after-read");
}
</script>
