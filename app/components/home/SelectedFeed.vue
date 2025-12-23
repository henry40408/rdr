<template>
  <q-chip v-if="feed" outline removable @remove="entryStore.setFeedId(entryStore.selectedCategoryId, undefined)">
    <q-avatar color="secondary" text-color="white">
      <q-icon name="rss_feed" />
    </q-avatar>
    Feed: {{ feed.title }}
  </q-chip>
</template>

<script setup lang="ts">
const categoryStore = useCategoryStore();
const entryStore = useEntryStore();

const feed = computed(() =>
  categoryStore.categories.flatMap((c) => c.feeds).find((f) => String(f.id) === entryStore.selectedFeedId),
);
</script>
