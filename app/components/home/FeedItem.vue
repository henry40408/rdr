<template>
  <q-item clickable @click="setFeedId(categoryId, feedId)">
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
      <q-item-label lines="1">
        <MarkedText :text="feed.title" :keyword="categoryKeyword" />
      </q-item-label>
    </q-item-section>
    <q-item-section side>
      <UnreadCount :count="feed.unreadCount" />
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
const props = defineProps<{
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

const { categoryKeyword } = useCategoryState();

const categoryId = computed(() => String(props.category.id));
const feedId = computed(() => String(props.feed.id));
const { setFeedId } = useEntryState();
</script>
