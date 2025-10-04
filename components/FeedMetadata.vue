<template>
  <div v-if="metadata">
    <small>
      Last fetched:
      <ClientSideDateTime v-if="metadata.fetchedAt" :datetime="metadata.fetchedAt" />
      <span v-else>never</span>
    </small>
  </div>
</template>

<script setup>
defineProps({
  metadata: { type: [Object, null] },
});
</script>
