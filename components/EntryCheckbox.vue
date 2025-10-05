<template>
  <input type="checkbox" :disabled="'pending' === status" @click="execute()" :checked="initial" />
</template>

<script setup>
const props = defineProps({
  entryId: { type: String, required: true },
  initial: { type: Boolean, default: false },
});

const emit = defineEmits(["toggled"]);

const { status, execute } = useFetch(`/api/entries/${props.entryId}/toggle`, {
  method: "PUT",
  immediate: false,
});

watch(status, (v) => {
  if (v === "success") emit("toggled", props.entryId);
});
</script>
