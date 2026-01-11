<template>
  <HomeCategoryItem v-for="category in store.categories" :key="category.id" :category="category" />
</template>

<script setup lang="ts">
const store = useCategoryStore();
</script>
