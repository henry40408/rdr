<template>
  <div class="space-y-2 px-4">
    <HomeEntryListItem
      v-for="item in store.items"
      :key="item.entry.id"
      :feed="item.feed"
      :entry="item.entry"
      :category="item.category"
    />
  </div>
</template>

<script setup lang="ts">
const store = useEntryStore();
</script>
