<template>
  <div class="border">
    <HomeCategoryItem v-for="category in store.categories" :key="category.id" :category="category" />
  </div>
</template>

<script setup lang="ts">
const store = useCategoryStore();
</script>
