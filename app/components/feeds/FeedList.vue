<template>
  <q-list>
    <FeedsFeedItem v-for="feed in feeds" :key="feed.id" :feed="feed" :category="category" />
  </q-list>
</template>

<script setup lang="ts">
defineProps<{
  category: {
    id: number;
    name: string;
  };
  feeds: {
    disableHttp2: boolean;
    errorCount: number;
    feedUpdatedAt?: string;
    fetchedAt?: string;
    htmlUrl: string;
    id: number;
    imageExists: boolean;
    lastError?: string;
    title: string;
    unreadCount: number;
    userAgent?: string;
    xmlUrl: string;
  }[];
}>();
</script>
