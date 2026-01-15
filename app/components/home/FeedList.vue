<template>
  <div class="space-y-2">
    <HomeFeedItem v-for="feed in category.feeds" :key="feed.id" :feed="feed" :category="category" />
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
      unreadCount: number;
      errorCount: number;
    }[];
  };
}>();
</script>
