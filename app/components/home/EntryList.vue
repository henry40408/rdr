<template>
  <div v-if="store.items.length > 0">
    <HomeEntryItem
      v-for="item in store.items"
      :key="item.entry.id"
      :feed="item.feed"
      :entry="item.entry"
      :category="item.category"
    />
    <div v-if="!store.hasMore" class="p-4 text-center bg-gray-200 dark:bg-gray-800">No more entries to load.</div>
  </div>
  <div v-else class="p-4 text-center bg-gray-200 dark:bg-gray-800">No entries to display.</div>
</template>

<script setup lang="ts">
const store = useEntryStore();
</script>
