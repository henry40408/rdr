<template>
  <button :disabled="'pending' === status" @click="execute()">
    {{ "pending" === status ? "Refreshing..." : "Refresh" }}
  </button>
  <span v-if="error">{{ error }}</span>
</template>

<script setup>
const props = defineProps({
  feedId: { type: String, required: true },
});

const events = defineEmits(["refreshed"]);

const { error, execute, status } = useFetch(`/api/feeds/${props.feedId}/refresh`, {
  method: "POST",
  immediate: false,
});

watch(status, (newStatus) => {
  if (newStatus === "success") events("refreshed");
});
</script>
