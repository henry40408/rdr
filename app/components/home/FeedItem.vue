<template>
  <q-item clickable @click="store.selectFeed(category.id, feed.id)">
    <q-item-section side>
      <q-avatar v-if="feed.imageExists" square size="xs">
        <img :alt="`Feed image of ${feed.title}`" :src="`/api/images/external/${buildFeedImageKey(feed.id)}`" />
      </q-avatar>
      <q-icon v-else size="xs" name="rss_feed" />
    </q-item-section>
    <q-item-section>
      <q-item-label>{{ feed.title }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
defineProps<{
  category: {
    id: number;
  };
  feed: {
    id: number;
    title: string;
    imageExists: boolean;
    unreadCount: number;
  };
}>();

const store = useEntryStore();
</script>
