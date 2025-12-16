<template>
  <q-item v-show="show" clickable @click="storeE.selectFeed(category.id, feed.id)">
    <q-item-section side>
      <q-avatar v-if="feed.imageExists" square size="xs">
        <img :alt="`Feed image of ${feed.title}`" :src="`/api/images/external/${buildFeedImageKey(feed.id)}`" />
      </q-avatar>
      <q-icon v-else size="xs" name="rss_feed" />
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
const props = defineProps<{
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

const storeC = useCategoryStore();
const storeE = useEntryStore();
const show = computed(() => {
  if (!storeC.hideEmpty) return true;
  const feed = storeC.categories.find((c) => c.id === props.category.id)?.feeds.find((f) => f.id === props.feed.id);
  if (!feed) return false;
  return feed.unreadCount > 0;
});
</script>
