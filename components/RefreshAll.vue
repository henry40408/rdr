<template>
  <button :disabled="'pending' === status" @click="execute()">
    {{ "pending" === status ? "Refreshing..." : "Refresh all feeds" }}
  </button>
  <span v-if="error">{{ error }}</span>
</template>

<script setup>
const events = defineEmits(["refreshed"]);

const { error, execute, status } = useFetch("/api/refresh", {
  method: "POST",
  immediate: false,
});

watch(status, (newStatus) => {
  if (newStatus === "success") events("refreshed");
});
</script>
