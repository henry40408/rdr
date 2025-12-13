<template>
  <HomeCategoryItem v-for="category in filteredCategories" :key="category.id" :category="category" />
</template>

<script setup lang="ts">
const { filteredCategories } = useCategories();
</script>
