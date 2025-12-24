<template>
  <q-avatar v-if="feed.imageExists" square size="xs" color="white">
    <img :alt="`Feed image of ${feed.title}`" :src="`/api/images/external/${buildFeedImageKey(feed.id)}`" />
  </q-avatar>
  <q-icon v-else size="xs" name="rss_feed" />
</template>

<script setup lang="ts">
defineProps<{
  feed: {
    id: number;
    title: string;
    imageExists: boolean;
  };
}>();
</script>
