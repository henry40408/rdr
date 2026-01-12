<template>
  <span v-if="props.datetime" :title="props.datetime">{{ formatted }}</span>
  <span v-else>Unknown date</span>
</template>

<script setup lang="ts">
import { formatDistanceToNow } from "date-fns";

const props = defineProps<{
  datetime: string | null | undefined;
}>();

const formatted = computed(() => {
  if (!props.datetime) return "Unknown date";
  const date = new Date(props.datetime);
  return formatDistanceToNow(date, { addSuffix: true });
});
</script>
