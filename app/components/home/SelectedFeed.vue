<template>
  <q-chip v-if="feed" outline removable @remove="storeE.selectFeed(categoryId, undefined)">
    <q-avatar color="secondary" text-color="white">
      <q-icon name="rss_feed" />
    </q-avatar>
    Feed: {{ feed.title }}
  </q-chip>
</template>

<script setup lang="ts">
const storeC = useCategoryStore();
const storeE = useEntryStore();
const categoryId = computed(() => storeE.selectedCategoryId);
const feed = computed(() =>
  storeC.categories.flatMap((c) => c.feeds).find((f) => String(f.id) === storeE.selectedFeedId),
);
</script>
