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
          <div>disable HTTP/2?</div>
          <div>
            <span v-if="feed.disableHttp2" class="bg-red-500 dark:bg-red-700 text-white p-1 text-sm">Yes</span>
            <span v-else class="bg-green-500 dark:bg-green-700 text-white p-1 text-sm">No</span>
          </div>
        </div>
        <div class="x-2-3">
          <div>user agent</div>
          <span v-if="feed.userAgent">{{ feed.userAgent }}</span>
          <span v-else class="x-na">N/A</span>
        </div>
        <div class="x-full">
          <div>last error</div>
          <span v-if="feed.lastError">{{ feed.lastError }}</span>
          <span v-else class="x-na">N/A</span>
        </div>
        <div class="x-full">
          <div>XML URL</div>
          <div>{{ feed.xmlUrl }}</div>
        </div>
        <div class="x-full">
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
    disableHttp2?: boolean;
    userAgent?: string;
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
  @apply grid grid-cols-1 gap-2 md:grid-cols-3;
}

.x-grid .x-full {
  @apply col-span-1 md:col-span-3;
}

.x-grid .x-2-3 {
  @apply col-span-1 md:col-span-2;
}

.x-grid div > div:first-child {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.x-grid div > div:last-child {
  @apply break-words;
}
</style>
