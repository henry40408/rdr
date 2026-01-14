<template>
  <FeedsFeedItem v-for="feed in feeds" :key="feed.id" :feed="feed" />
</template>

<script setup lang="ts">
defineProps<{
  feeds: {
    id: number;
    title: string;
    imageExists: boolean;
  }[];
}>();
</script>
