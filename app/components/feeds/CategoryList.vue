<template>
  <q-list padding>
    <FeedsCategoryItem v-for="category in store.categories" :key="category.id" :category="category" />
  </q-list>
</template>

<script setup lang="ts">
const store = useCategoryStore();

await store.load();
</script>
