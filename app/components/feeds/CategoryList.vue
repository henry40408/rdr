<template>
  <FeedsCategoryItem v-for="category in store.filteredCategories" :key="category.id" :category="category" />
</template>

<script setup lang="ts">
const store = useCategoryStore();
</script>
