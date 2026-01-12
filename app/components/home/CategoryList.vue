<template>
  <div class="border dark:border-gray-500">
    <HomeCategoryItem v-for="category in store.sortedCategories" :key="category.id" :category="category" />
  </div>
</template>

<script setup lang="ts">
const store = useCategoryStore();
</script>
