<template>
  <button :disabled="disabled || 'pending' === status" @click="execute()">
    {{ "pending" === status ? "Refreshing..." : "Refresh feed" }}
  </button>
  <span v-if="error">{{ error }}</span>
</template>

<script setup>
const props = defineProps({
  disabled: { type: Boolean, default: false },
  feedId: { type: String, required: true },
});

const events = defineEmits(["refreshed", "refreshing"]);

const { error, execute, status } = useFetch(`/api/feeds/${props.feedId}/refresh`, {
  method: "POST",
  immediate: false,
});

watch(status, (newStatus) => {
  if (newStatus === "pending") events("refreshing");
  if (newStatus === "success") events("refreshed");
});
</script>
