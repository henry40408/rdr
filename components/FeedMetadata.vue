<template>
  <div v-if="metadata">
    <small>Last fetched: {{ new Date(metadata.fetchedAt).toLocaleString() }}</small>
  </div>
</template>

<script setup>
const props = defineProps({
  metadata: { type: [Object, null] },
});
</script>
