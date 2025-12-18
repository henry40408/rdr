<template>
  <q-item v-show="show" clickable @click="entryStore.setCategoryId(category.id)">
    <q-item-section>
      <q-item-label lines="1">
        <MarkedText :text="category.name" :keyword="categoryStore.keyword" />
      </q-item-label>
    </q-item-section>
    <q-item-section side>
      <UnreadCount :count="unreadCount" />
    </q-item-section>
  </q-item>
  <HomeFeedList :category="category" :feeds="category.feeds" />
  <q-separator v-show="show" spaced />
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

const categoryStore = useCategoryStore();
const entryStore = useEntryStore();

const show = computed(() => {
  if (categoryStore.keyword) {
    const categoryMatched = props.category.name.toLowerCase().includes(categoryStore.keyword.toLowerCase());
    const feedsMatched = props.category.feeds.some((f) =>
      f.title.toLowerCase().includes(categoryStore.keyword.toLowerCase()),
    );
    return categoryMatched || feedsMatched;
  }

  if (!categoryStore.hideEmpty) return true;
  return props.category.feeds.reduce((acc, f) => acc + f.unreadCount, 0) > 0;
});
const unreadCount = computed(() => props.category.feeds.reduce((acc, f) => acc + f.unreadCount, 0));
</script>
