<template>
  <q-list>
    <HomeCategoryItem v-for="category in store.sortedCategories" :key="category.id" :category="category" />
  </q-list>
</template>

<script setup lang="ts">
const store = useCategoryStore();
</script>
