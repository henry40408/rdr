<template>
  <q-list separator>
    <HomeEntryItem
      v-for="item in store.items"
      :key="item.entry.id"
      :feed="item.feed"
      :entry="item.entry"
      :category="item.category"
    />
  </q-list>
</template>

<script setup lang="ts">
const store = useEntryStore();
</script>
