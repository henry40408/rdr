<template>
  <div>
    <FeedsSideCategoryItem v-for="category in store.filteredCategories" :key="category.id" :category="category" />
  </div>
</template>

<script setup lang="ts">
const store = useCategoryStore();
</script>
