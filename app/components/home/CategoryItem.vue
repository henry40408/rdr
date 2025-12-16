<template>
  <q-item clickable @click="store.selectCategory(category.id)">
    <q-item-section>
      <q-item-label>{{ category.name }}</q-item-label>
    </q-item-section>
  </q-item>
  <HomeFeedList :category="category" />
  <q-separator spaced />
</template>

<script setup lang="ts">
defineProps<{
  category: {
    id: number;
    name: string;
  };
}>();

const store = useEntryStore();
</script>
