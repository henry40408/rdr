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

const { error, execute, status } = useFetch(`/api/feeds/${props.feedId}/refresh`, {
  method: "POST",
  immediate: false,
  lazy: true,
});
</script>
