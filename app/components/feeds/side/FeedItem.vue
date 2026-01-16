<template>
  <div class="space-x-2">
    <img
      v-if="feed.imageExists"
      class="bg-white inline h-4 w-4"
      :src="`/api/images/external/${buildFeedImageKey(feed.id)}`"
    />
    <span v-else>&#x1F4E1;</span>
    <a :href="`#feed-${feed.id}`" :class="{ 'text-red-500 font-bold': hasError }">{{ feed.title }}</a>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  feed: {
    id: number;
    title: string;
    imageExists: boolean;
    errorCount: number;
  };
}>();

const hasError = computed(() => props.feed.errorCount > 0);
</script>
