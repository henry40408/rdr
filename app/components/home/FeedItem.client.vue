<template>
  <div v-if="localSettings.showEmpty || feed.unreadCount > 0">
    <span>&gt;&gt;</span>
    {{ " " }}
    <a href="#" @click.prevent="entryStore.setFeed(feed.id, category.id)">{{ feed.title }}</a>
    <span>({{ feed.unreadCount }})</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  feed: {
    id: number;
    title: string;
    unreadCount: number;
  };
  category: {
    id: number;
    name: string;
  };
}>();

const entryStore = useEntryStore();
const localSettings = useLocalSettings();
</script>
