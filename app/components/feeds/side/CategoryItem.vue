<template>
  <div class="border-b last:border-b-0 dark:border-gray-500 p-2 space-y-2">
    <div class="space-x-2">
      <span>&#x1F4C1;</span>
      <a :href="`#category-${category.id}`">{{ category.name }}</a>
    </div>
    <FeedsSideFeedList :feeds="category.feeds" />
  </div>
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
