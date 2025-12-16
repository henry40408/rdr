<template>
  <q-item v-show="show" clickable @click="storeE.selectCategory(category.id)">
    <q-item-section>
      <q-item-label>{{ category.name }}</q-item-label>
    </q-item-section>
    <q-item-section side>
      <UnreadCount :count="unreadCount" />
    </q-item-section>
  </q-item>
  <HomeFeedList :category="category" />
  <q-separator spaced />
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
