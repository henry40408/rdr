<template>
  <span v-if="datetime" :title="formatDateTime(datetime)">{{ formatDateTime(datetime) }}</span>
  <span v-else>Unknown date</span>
</template>

<script setup lang="ts">
defineProps<{
  datetime: string | null | undefined;
}>();

function formatDateTime(datetime: string): string {
  const date = new Date(datetime);
  return date.toLocaleString();
}
</script>
