<template>
  <q-item clickable @click="setFeedId(category.id, feed.id)">
    <q-item-section side>
      <q-avatar v-if="feed.imageExists" square size="xs">
        <img
          loading="lazy"
          decoding="async"
          :alt="`Feed Image for ${feed.title}`"
          :src="`/api/images/external/${buildFeedImageKey(feed.id)}`"
        />
      </q-avatar>
      <q-icon v-else size="xs" name="rss_feed" />
    </q-item-section>
    <q-item-section>
      <q-item-label lines="1">{{ feed.title }}</q-item-label>
    </q-item-section>
    <q-item-section side>
      <UnreadCount :count="feed.unreadCount" />
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
defineProps<{
  feed: {
    id: number;
    title: string;
    imageExists: boolean;
    unreadCount: number;
  };
  category: {
    id: number;
  };
}>();

const { setFeedId } = useEntries();
</script>
