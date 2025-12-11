<template>
  <q-item>
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
}>();
</script>
