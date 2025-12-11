<template>
  <q-item>
    <q-item-section>
      <q-item-label>{{ category.name }}</q-item-label>
    </q-item-section>
  </q-item>
  <HomeFeedList :feeds="category.feeds" />
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
</script>
