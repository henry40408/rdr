<template>
  <FeedsFeedItem v-for="feed in feeds" :key="feed.id" :feed="feed" />
</template>

<script setup lang="ts">
defineProps<{
  feeds: {
    id: number;
    categoryId: number;
    title: string;
    imageExists: boolean;
    errorCount: number;
    lastError?: string;
    xmlUrl: string;
    htmlUrl?: string;
    fetchedAt?: string;
    feedUpdatedAt?: string;
    disableHttp2?: boolean;
    userAgent?: string;
  }[];
}>();
</script>
