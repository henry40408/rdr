<template>
  <div class="px-2">
    <div v-if="store.items.length > 0" class="border">
      <HomeEntryItem
        v-for="item in store.items"
        :key="item.entry.id"
        :feed="item.feed"
        :entry="item.entry"
        :category="item.category"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const store = useEntryStore();
</script>
