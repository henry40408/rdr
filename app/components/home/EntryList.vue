<template>
  <div>
    <div v-if="store.items.length > 0" class="border dark:border-gray-500">
      <HomeEntryItem
        v-for="item in store.items"
        :key="item.entry.id"
        :feed="item.feed"
        :entry="item.entry"
        :category="item.category"
      />
    </div>
    <div v-else>No entries to display.</div>
  </div>
</template>

<script setup lang="ts">
const store = useEntryStore();
</script>
