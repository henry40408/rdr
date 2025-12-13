<template>
  <time :title="date.toLocaleString()" :datetime="date.toLocaleString()">{{ distanceToNow }}</time>
</template>

<script setup lang="ts">
import { formatDistanceToNow } from "date-fns";

const props = defineProps<{
  date: string;
}>();

const date = computed(() => new Date(props.date));
const distanceToNow = computed(() => formatDistanceToNow(date.value, { addSuffix: true }));
</script>
