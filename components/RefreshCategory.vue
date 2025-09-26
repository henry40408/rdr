<template>
  <button :disabled="'pending' === status" @click="execute()">
    {{ "pending" === status ? "Refreshing..." : "Refresh" }}
  </button>
  <span v-if="error">{{ error }}</span>
</template>

<script setup>
const props = defineProps({
  categoryId: { type: String, required: true },
});

const { error, execute, status } = useFetch(`/api/categories/${props.categoryId}/refresh`, {
  method: "POST",
  immediate: false,
});
</script>
