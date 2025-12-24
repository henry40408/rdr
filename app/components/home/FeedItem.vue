<template>
  <q-item v-show="show" clickable @click="entryStore.setFeedId(category.id, feed.id)">
    <q-item-section side>
      <FeedIcon :feed="feed" />
    </q-item-section>
    <q-item-section>
      <q-item-label lines="1">
        <MarkedText :text="feed.title" :keyword="categoryStore.keyword" />
      </q-item-label>
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

const categoryStore = useCategoryStore();
const entryStore = useEntryStore();

const show = computed(() => {
  if (categoryStore.keyword) return props.feed.title.toLowerCase().includes(categoryStore.keyword.toLowerCase());
  if (!categoryStore.hideEmpty) return true;
  const feed = categoryStore.categories
    .find((c) => c.id === props.category.id)
    ?.feeds.find((f) => f.id === props.feed.id);
  if (!feed) return false;
  return feed.unreadCount > 0;
});
</script>
