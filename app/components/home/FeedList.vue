<template>
  <HomeFeedItem v-for="feed in category.feeds" :key="feed.id" :feed="feed" :category="category" />
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
    }[];
  };
}>();
</script>
