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
  <HomeFeedList :category="category" />
  <q-separator v-show="show" spaced />
</template>

<script setup lang="ts">
const props = defineProps<{
  category: {
    id: number;
    name: string;
  };
}>();

const storeC = useCategoryStore();
const storeE = useEntryStore();
const show = computed(() => {
  if (storeC.keyword) {
    const categoryMatched = props.category.name.toLowerCase().includes(storeC.keyword.toLowerCase());
    const feedsMatched = storeC.categories
      .find((c) => c.id === props.category.id)
      ?.feeds.some((f) => f.title.toLowerCase().includes(storeC.keyword.toLowerCase()));
    return categoryMatched || feedsMatched;
  }
  if (!storeC.hideEmpty) return true;
  const category = storeC.categories.find((c) => c.id === props.category.id);
  if (!category) return false;
  return category.feeds.reduce((acc, f) => acc + f.unreadCount, 0) > 0;
});
const unreadCount = computed(
  () =>
    storeC.categories.find((c) => c.id === props.category.id)?.feeds.reduce((acc, f) => acc + f.unreadCount, 0) ?? 0,
);
</script>
