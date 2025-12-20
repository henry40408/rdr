<template>
  <q-list padding>
    <q-item-label header>Categories / feeds</q-item-label>
    <FeedsCategoryItem v-for="category in store.categories" :key="category.id" :category="category" />
  </q-list>
</template>

<script setup lang="ts">
const store = useCategoryStore();

await store.load();
</script>
