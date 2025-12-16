<template>
  <q-list>
    <HomeCategoryItem v-for="category in store.categories" :key="category.id" :category="category" />
  </q-list>
</template>

<script setup lang="ts">
const store = useCategoryStore();
await store.loadCategories();
</script>
