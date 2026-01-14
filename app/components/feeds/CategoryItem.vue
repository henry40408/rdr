<template>
  <div class="border-b p-2 border-b-gray-500 dark:border-b-gray-500">{{ category.name }}</div>
  <FeedsFeedList :feeds="category.feeds" />
</template>

<script setup lang="ts">
defineProps<{
  category: {
    id: number;
    name: string;
    feeds: {
      id: number;
      title: string;
    }[];
  };
}>();
</script>
