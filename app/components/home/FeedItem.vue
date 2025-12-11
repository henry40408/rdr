<template>
  <q-item clickable @click="setFeedId(category.id, feed.id)">
    <q-item-section v-if="feed.imageExists" side>
      <q-avatar square size="xs">
        <img
          loading="lazy"
          decoding="async"
          :alt="`Feed Image for ${feed.title}`"
          :src="`/api/images/external/${buildFeedImageKey(feed.id)}`"
        />
      </q-avatar>
    </q-item-section>
    <q-item-section>
      <q-item-label>{{ feed.title }}</q-item-label>
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
