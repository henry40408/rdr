<template>
  <div v-if="localSettings.showEmpty || feed.unreadCount > 0">
    <span>&gt;&gt;</span>
    {{ feed.title }} <span>({{ feed.unreadCount }})</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  feed: {
    id: number;
    title: string;
    unreadCount: number;
  };
}>();

const localSettings = useLocalSettings();
</script>
