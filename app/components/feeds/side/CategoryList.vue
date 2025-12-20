<template>
  <q-list padding>
    <q-item-label header>Categories</q-item-label>
    <FeedsSideCategoryItem v-for="category in store.categories" :key="category.id" :category="category" />
  </q-list>
</template>

<script setup lang="ts">
const store = useCategoryStore();
</script>
