<template>
  <div>
    <div class="text-sm text-gray-500 dark:text-gray-400">{{ category.name }} &middot; {{ feed.title }}</div>
    <div>
      <ExternalLink :href="entry.link">{{ entry.title }}</ExternalLink>
    </div>
    <details :open="open" @toggle="toggle">
      <summary>content</summary>
      <div class="border border-gray-700 p-2">
        <MarkedText v-if="contentStatus === 'success'" :text="content" class="x-content" />
        <div v-if="contentStatus === 'pending'">Loading...</div>
        <div v-else-if="contentStatus === 'error'" class="text-red-600 dark:text-red-400">{{ content }}</div>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  entry: {
    id: number;
    title: string;
    link: string;
  };
  feed: {
    id: number;
    title: string;
  };
  category: {
    id: number;
    name: string;
  };
}>();

const content = ref("");
const open = ref(false);

function toggle() {
  open.value = !open.value;
  if (open.value) loadContent();
}

const contentStatus = ref<"idle" | "pending" | "success" | "error">("idle");
async function loadContent() {
  if (["pending", "success"].includes(contentStatus.value)) return;

  content.value = "";
  contentStatus.value = "pending";
  try {
    const data = await $fetch(`/api/entries/${props.entry.id}/content`);
    content.value = data.content;
    contentStatus.value = "success";
  } catch (e) {
    contentStatus.value = "error";
    content.value = String(e);
  }
}
</script>

<style scope>
@reference "tailwindcss";

.x-content a {
  @apply text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-600;
}
.x-content h1,
.x-content h2,
.x-content h3 {
  @apply font-bold mt-4 mb-2;
}
.x-content img {
  @apply max-w-full h-auto mb-2;
}
.x-content p {
  @apply mb-2;
}
.x-content pre {
  @apply bg-gray-100 dark:bg-gray-800 p-2 overflow-x-auto;
}
</style>
