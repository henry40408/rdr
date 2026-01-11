<template>
  <div v-if="localSettings.showEmpty || feed.unreadCount > 0">
    <span class="text-gray-600 dark:text-gray-400">&gt;&gt;</span>
    {{ feed.title }} <span class="text-gray-600 dark:text-gray-400">({{ feed.unreadCount }})</span>
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
