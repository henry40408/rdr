<template>
  <div class="border-b border-b-gray-500 dark:border-b-gray-500 p-2 space-y-2">
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
      <span>
        {{ feed.title }}
        <span v-if="feed.htmlUrl">
          <ExternalLink :href="feed.htmlUrl">website</ExternalLink>
        </span>
      </span>
    </div>
    <div>
      <div class="x-grid">
        <div>
          <div>error count</div>
          <div>{{ feed.errorCount }}</div>
        </div>
        <div>
          <div>last error</div>
          <span v-if="feed.lastError">{{ feed.lastError }}</span>
          <span v-else class="x-na">N/A</span>
        </div>
        <div>
          <div>fetched at</div>
          <span v-if="feed.fetchedAt">
            <DurationToNow :datetime="feed.fetchedAt" />
          </span>
          <span v-else class="x-na">N/A</span>
        </div>
        <div>
          <div>feed updated at</div>
          <span v-if="feed.feedUpdatedAt">
            <DurationToNow :datetime="feed.feedUpdatedAt" />
          </span>
          <span v-else class="x-na">N/A</span>
        </div>
        <div>
          <div>XML URL</div>
          <div>{{ feed.xmlUrl }}</div>
        </div>
        <div>
          <div>HTML URL</div>
          <div>{{ feed.htmlUrl }}</div>
        </div>
      </div>
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
    lastError?: string;
    xmlUrl: string;
    htmlUrl?: string;
    fetchedAt?: string;
    feedUpdatedAt?: string;
  };
}>();

const hasError = computed(() => props.feed.errorCount > 0);
</script>

<style scoped>
@reference "tailwindcss";

.x-na {
  @apply text-sm bg-gray-400 dark:bg-gray-600 p-1;
}

.x-grid {
  @apply grid grid-cols-1 gap-4 md:grid-cols-2;
}

.x-grid div > div:first-child {
  @apply text-sm text-gray-500 dark:text-gray-400;
}
</style>
