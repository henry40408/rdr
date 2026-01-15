<template>
  <div class="border-b border-b-gray-500 dark:border-b-gray-500 p-2">
    <div class="space-x-2">
      <span>
        <span v-if="hasError">&#x274C;</span>
        <span v-else>&#x2705;</span>
      </span>
      <span>
        <img
          v-if="feed.imageExists"
          class="bg-white inline h-4 w-4"
          :src="`/api/images/external/${buildFeedImageKey(feed.id)}`"
        />
        <span v-else>&#x1F4E1;</span>
      </span>
      <span>{{ feed.title }}</span>
    </div>
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
