<template>
  <HomeFeedItem v-for="feed in feeds" :key="feed.id" :feed="feed" :category="category" />
</template>

<script setup lang="ts">
defineProps<{
  feeds: {
    id: number;
    title: string;
    imageExists: boolean;
    unreadCount: number;
  }[];
  category: {
    id: number;
  };
}>();
</script>
