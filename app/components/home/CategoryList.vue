<template>
  <HomeCategoryItem v-for="category in filteredCategories" :key="category.id" :category="category" />
  <q-banner v-if="filteredCategories.length === 0">
    <q-icon name="info" class="q-mr-sm" />
    No categories match the filter.
  </q-banner>
</template>

<script setup lang="ts">
const { filteredCategories } = useCategories();
</script>
