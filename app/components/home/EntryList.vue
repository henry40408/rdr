<template>
  <div>
    <div v-if="store.items.length > 0">
      <HomeEntryItem
        v-for="item in store.items"
        :key="item.entry.id"
        :feed="item.feed"
        :entry="item.entry"
        :category="item.category"
      />
    </div>
    <div v-else class="p-2">No entries to display.</div>
  </div>
</template>

<script setup lang="ts">
const store = useEntryStore();
</script>
