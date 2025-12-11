<template>
  <q-item clickable @click="setCategoryId(category.id)">
    <q-item-section>
      <q-item-label>{{ category.name }}</q-item-label>
    </q-item-section>
  </q-item>
  <HomeFeedList :category="category" :feeds="category.feeds" />
  <q-separator spaced />
</template>

<script setup lang="ts">
defineProps<{
  category: {
    id: number;
    name: string;
    feeds: {
      id: number;
      title: string;
    }[];
  };
}>();

const { setCategoryId } = useEntries();
</script>
