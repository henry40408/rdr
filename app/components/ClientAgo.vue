<template>
  <ClientOnly>
    <span :title="localeString">{{ formatted }}</span>
  </ClientOnly>
</template>

<script setup>
import { formatDistanceToNow } from "date-fns";

const props = defineProps({ datetime: { type: [String, Date], required: true } });

const localeString = computed(() => {
  if (!props.datetime) return;
  return new Date(props.datetime).toLocaleString();
});
const formatted = computed(() => formatDistanceToNow(new Date(props.datetime), { addSuffix: true }));
</script>
