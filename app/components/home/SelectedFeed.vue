<template>
  <q-chip v-if="feed" outline removable @remove="setFeedId(selectedCategoryId, undefined)">
    <q-avatar color="secondary" text-color="white">
      <q-icon name="rss_feed" />
    </q-avatar>
    Feed: {{ feed.title }}
  </q-chip>
</template>

<script setup lang="ts">
const { categories } = useCategories();
const { selectedCategoryId, selectedFeedId, setFeedId } = useEntryFilters();
const feeds = computed(() => categories.value.flatMap((cat) => cat.feeds));
const feed = computed(() => feeds.value.find((f) => String(f.id) === selectedFeedId.value));
</script>
