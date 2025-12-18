<template>
  <q-list>
    <HomeCategoryItem v-for="category in categories" :key="category.id" :category="category" />
  </q-list>
</template>

<script setup lang="ts">
const store = useCategoryStore();

const categories = computed(() => store.categories);
</script>
