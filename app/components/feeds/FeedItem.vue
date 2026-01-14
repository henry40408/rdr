<template>
  <div class="border-b border-b-gray-500 dark:border-b-gray-500 p-2">
    <img
      v-if="feed.imageExists"
      class="bg-white inline h-4 w-4"
      :src="`/api/images/external/${buildFeedImageKey(feed.id)}`"
    />
    <span v-else>&#x1F4E1;</span>
    {{ feed.title }}
  </div>
</template>

<script setup lang="ts">
defineProps<{
  feed: {
    id: number;
    title: string;
    imageExists: boolean;
  };
}>();
</script>
