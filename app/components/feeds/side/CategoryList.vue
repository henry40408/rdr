<template>
  <q-list>
    <q-item-label header>Categories</q-item-label>
    <q-item>
      <q-item-section>
        <q-btn icon="refresh" color="primary" label="Refresh" :loading="store.pending" @click="store.load()" />
      </q-item-section>
    </q-item>
    <FeedsSideCategoryItem v-for="category in store.categories" :key="category.id" :category="category" />
  </q-list>
</template>

<script setup lang="ts">
const store = useCategoryStore();
</script>
