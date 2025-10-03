<template>
  <button :disabled="'pending' === status" @click="execute()">
    {{ "pending" === status ? "Refreshing..." : "Refresh category" }}
  </button>
  <span v-if="error">{{ error }}</span>
</template>

<script setup>
const props = defineProps({
  categoryId: { type: String, required: true },
});

const events = defineEmits(["refreshed", "refreshing"]);

const { error, execute, status } = useFetch(`/api/categories/${props.categoryId}/refresh`, {
  method: "POST",
  immediate: false,
});

watch(status, (newStatus) => {
  if (newStatus === "pending") events("refreshing");
  if (newStatus === "success") events("refreshed");
});
</script>
