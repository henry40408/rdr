<template>
  <time :title="formatted" :datetime="datetime">{{ timeAgo }}</time>
</template>

<script setup lang="ts">
import { formatDistanceToNow } from "date-fns";

const props = defineProps<{
  datetime: string;
}>();

const formatted = new Date(props.datetime).toLocaleString();
const timeAgo = computed(() => formatDistanceToNow(new Date(props.datetime), { addSuffix: true }));
</script>
