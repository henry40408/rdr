<template>
  <div v-if="metadata">
    <small>Last fetched: <ClientSideDateTime :datetime="metadata.fetchedAt" /></small>
  </div>
</template>

<script setup>
defineProps({
  metadata: { type: [Object, null] },
});
</script>
