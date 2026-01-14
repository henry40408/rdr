<template>
  <div class="border-b p-2 border-b-gray-500 dark:border-b-gray-500">
    <div class="space-x-2">
      <span>&#x1F4C1;</span>
      <span>{{ category.name }}</span>
    </div>
  </div>
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
      imageExists: boolean;
    }[];
  };
}>();
</script>
