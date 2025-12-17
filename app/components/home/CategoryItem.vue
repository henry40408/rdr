<template>
  <q-item v-show="show" clickable @click="storeE.selectCategory(category.id)">
    <q-item-section>
      <q-item-label lines="1">
        <MarkedText :text="category.name" :keyword="storeC.keyword" />
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

const storeC = useCategoryStore();
const storeE = useEntryStore();

const show = computed(() => {
  if (storeC.keyword) {
    const categoryMatched = props.category.name.toLowerCase().includes(storeC.keyword.toLowerCase());
    const feedsMatched = props.category.feeds.some((f) => f.title.toLowerCase().includes(storeC.keyword.toLowerCase()));
    return categoryMatched || feedsMatched;
  }

  if (!storeC.hideEmpty) return true;
  return props.category.feeds.reduce((acc, f) => acc + f.unreadCount, 0) > 0;
});
const unreadCount = computed(() => props.category.feeds.reduce((acc, f) => acc + f.unreadCount, 0));
</script>
