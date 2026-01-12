<template>
  <div class="border-b last:border-b-0 p-2 space-y-2">
    <div class="text-sm">
      {{ feed.title }} &middot; {{ category.name }} &middot; <DurationToNow :datetime="entry.date" />
    </div>
    <div class="flex items-center gap-2">
      <img
        v-if="imageExists"
        alt="Feed Image"
        class="w-4 h-4 bg-white"
        :src="`/api/images/external/${buildFeedImageKey(feed.id)}`"
      />
      <ExternalLink :href="entry.link">{{ entry.title }}</ExternalLink>
    </div>
    <details :open="open" @toggle="toggle">
      <summary>content</summary>
      <div class="mt-2">
        <MarkedText v-if="contentStatus === 'success'" :text="content" class="x-content" />
        <div v-if="contentStatus === 'pending'">Loading...</div>
        <div v-else-if="contentStatus === 'error'">{{ content }}</div>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
const categoryStore = useCategoryStore();

const props = defineProps<{
  entry: {
    id: number;
    title: string;
    link: string;
    date: string;
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

const imageExists = computed(
  () =>
    categoryStore.categories.find((c) => c.id === props.category.id)?.feeds.find((f) => f.id === props.feed.id)
      ?.imageExists ?? false,
);

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
  @apply underline;
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
  @apply p-2 overflow-x-auto;
}
</style>
