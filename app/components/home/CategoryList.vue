<template>
  <HomeCategoryItem v-for="category in categories" :key="category.id" :category="category" />
</template>

<script setup lang="ts">
const { categories } = useCategories();
</script>
