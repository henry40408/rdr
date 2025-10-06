<template>
  <div>
    <small>Entry count: {{ count }}</small>
  </div>
  <div>
    <small>
      Last fetched:
      <ClientSideDateTime v-if="fetchedAt" :datetime="fetchedAt" />
      <span v-else>never</span>
    </small>
  </div>
</template>

<script setup>
const props = defineProps({
  count: { type: Number, required: true },
  fetchedAt: { type: String },
});
</script>
