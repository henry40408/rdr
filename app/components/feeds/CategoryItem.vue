<template>
  <div class="border-b border-b-gray-500 dark:border-b-gray-500">
    <div v-if="error" class="bg-red-500 dark:bg-red-700 text-white p-2">{{ error }}</div>
    <div class="p-2 space-y-2">
      <div class="space-x-2">
        <span>&#x1F4C1;</span>
        <span>{{ category.name }}</span>
      </div>
      <div>
        <XButton :disabled="refreshing" @click="refresh">
          {{ refreshing ? "Refreshing..." : "Refresh" }}
        </XButton>
      </div>
    </div>
  </div>
  <FeedsFeedList :feeds="category.feeds" />
</template>

<script setup lang="ts">
const store = useCategoryStore();

const props = defineProps<{
  category: {
    id: number;
    name: string;
    feeds: {
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
    }[];
  };
}>();

const error = ref("");

const refreshing = ref(false);
async function refresh() {
  if (refreshing.value) return;
  error.value = "";
  refreshing.value = true;
  try {
    const tasks = [];
    for (const feed of props.category.feeds) {
      tasks.push(fetch(`/api/feeds/${feed.id}/refresh`, { method: "POST" }));
    }
    await Promise.all(tasks);
    await store.load();
  } catch (err) {
    error.value = String(err);
  } finally {
    refreshing.value = false;
  }
}
</script>
