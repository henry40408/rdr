<template>
  <q-list padding>
    <q-item-label header>Categories / feeds</q-item-label>
    <q-item>
      <ClientOnly>
        <q-toggle v-model="store.showErrorOnly" label="Show only feeds with errors" />
      </ClientOnly>
    </q-item>
    <FeedsCategoryItem v-for="category in store.categories" :key="category.id" :category="category" />
  </q-list>
</template>

<script setup lang="ts">
const store = useCategoryStore();
</script>
