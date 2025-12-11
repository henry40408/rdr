<template>
  <q-item clickable @click="setFeedId(category.id, feed.id)">
    <q-item-section>
      <q-item-label>{{ feed.title }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
defineProps<{
  feed: {
    id: number;
    title: string;
  };
  category: {
    id: number;
  };
}>();

const { setFeedId } = useEntries();
</script>
