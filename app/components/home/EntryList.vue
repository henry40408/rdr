<template>
  <HomeEntryListItem v-for="item in store.items" :key="item.entry.id" :entry="item.entry" />
</template>

<script setup lang="ts">
const store = useEntryStore();
</script>
