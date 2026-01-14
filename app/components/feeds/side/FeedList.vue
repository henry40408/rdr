<template>
  <div class="space-y-2">
    <FeedsSideFeedItem v-for="feed in feeds" :key="feed.id" :feed="feed" />
  </div>
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
