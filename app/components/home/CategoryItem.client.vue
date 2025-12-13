<template>
  <q-item v-show="show" clickable @click="setCategoryId(categoryId)">
    <q-item-section>
      <q-item-label lines="1">
        <MarkedText :text="category.name" :keyword="categoryKeyword" />
      </q-item-label>
    </q-item-section>
    <q-item-section side>
      <UnreadCount :count="count" />
    </q-item-section>
  </q-item>
  <HomeFeedList :category="category" :feeds="category.feeds" />
  <q-separator spaced />
</template>

<script setup lang="ts">
const props = defineProps<{
  category: {
    id: number;
    name: string;
    feeds: {
      id: number;
      title: string;
      imageExists: boolean;
      unreadCount: number;
    }[];
  };
}>();

const { categoryKeyword } = useCategoryState();
const { setCategoryId } = useEntryState();
const { hideEmpty } = useLocalSettings();

const categoryId = computed(() => String(props.category.id));
const count = computed(() => props.category.feeds.reduce((sum, feed) => sum + feed.unreadCount, 0));
const show = computed(() => {
  if (!hideEmpty.value) return true;
  const feedsCount = props.category.feeds.reduce((sum, feed) => sum + feed.unreadCount, 0);
  return feedsCount > 0;
});
</script>
