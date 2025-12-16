<template>
  <time :datetime="date" :title="formatted">{{ timeAgo }}</time>
</template>

<script setup lang="ts">
import { formatDistanceToNow } from "date-fns";

const props = defineProps<{
  date: string;
}>();

const formatted = computed(() => new Date(props.date).toLocaleString());
const timeAgo = computed(() => formatDistanceToNow(new Date(props.date), { addSuffix: true }));
</script>
