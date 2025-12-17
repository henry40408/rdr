<template>
  <HomeFeedItem v-for="feed in feeds" :key="feed.id" :feed="feed" :category="category" />
</template>

<script setup lang="ts">
defineProps<{
  category: {
    id: number;
  };
  feeds: {
    id: number;
    title: string;
    imageExists: boolean;
    unreadCount: number;
  }[];
}>();
</script>
