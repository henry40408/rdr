<template>
  <div class="border-b border-b-gray-500 dark:border-b-gray-500 p-2">{{ feed.title }}</div>
</template>

<script setup lang="ts">
defineProps<{
  feed: {
    id: number;
    title: string;
  };
}>();
</script>
