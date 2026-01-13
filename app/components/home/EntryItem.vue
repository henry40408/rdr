<template>
  <div ref="entry" :class="{ 'bg-gray-300 dark:bg-black': isRead }" class="border-b last:border-b-0 border-b-gray-500">
    <div v-if="error" class="text-white bg-red-500 p-2">{{ error }}</div>
    <div class="p-2 space-y-2 hover:bg-gray-200 hover:dark:bg-gray-800 hover:cursor-pointer" @click="toggle">
      <div class="text-sm">
        <a href="#" @click.prevent.stop="entryStore.setFeed(feed.id, category.id)">{{ feed.title }}</a>
        &middot;
        <a href="#" @click.prevent.stop="entryStore.setCategory(category.id)">{{ category.name }}</a>
        &middot; <DurationToNow :datetime="entry.date" />
      </div>
      <div class="flex items-center space-x-2">
        <input type="checkbox" :checked="isRead" :disabled="reading" @change.prevent.stop="toggleRead" />
        <div>
          <img
            v-if="imageExists"
            alt="Feed Image"
            class="w-4 h-4 align-middle bg-white inline mr-2"
            :src="`/api/images/external/${buildFeedImageKey(feed.id)}`"
          />
          <MarkedText
            :text="entry.title"
            :keyword="entryStore.search"
            :class="{ 'line-through text-gray-500': isRead }"
          />
        </div>
      </div>
    </div>
    <div v-if="open" class="p-2 space-y-4">
      <div class="text-lg font-bold">
        <ExternalLink :href="entry.link">{{ entry.title }}</ExternalLink>
      </div>
      <div>
        <span v-if="entry.author">Author: {{ entry.author }}</span>
      </div>
      <div>
        <button v-if="!['success', 'error'].includes(fullContentStatus)" class="x-button" @click="loadFullContent">
          {{ fullContentStatus === "pending" ? "loading..." : "full content" }}
        </button>
        <button v-else class="x-button x-revert" @click="fullContentStatus = 'idle'">revert original</button>
      </div>
      <div>
        <MarkedText class="x-content" :text="mergedContent" :keyword="entryStore.search" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const categoryStore = useCategoryStore();
const entryStore = useEntryStore();
const templateRef = useTemplateRef("entry");

const props = defineProps<{
  entry: {
    id: number;
    title: string;
    link: string;
    date: string;
    author?: string;
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
const error = ref("");
const fullContent = ref("");
const open = ref(false);

const imageExists = computed(
  () =>
    categoryStore.categories.find((c) => c.id === props.category.id)?.feeds.find((f) => f.id === props.feed.id)
      ?.imageExists ?? false,
);
const isRead = computed(() => entryStore.readIds.includes(props.entry.id));
const mergedContent = computed(() => {
  if (fullContentStatus.value === "success") return fullContent.value;
  if (contentStatus.value === "success") return content.value;
  return "";
});

function onCollapseOthers(entryId: number) {
  if (entryId !== props.entry.id) open.value = false;
}
onMounted(() => {
  eventBus.on(EVENT_COLLAPSE_OTHERS, onCollapseOthers);
});
onUnmounted(() => {
  eventBus.off(EVENT_COLLAPSE_OTHERS, onCollapseOthers);
});

async function toggle() {
  const newValue = !open.value;
  if (newValue) {
    eventBus.emit(EVENT_COLLAPSE_OTHERS, props.entry.id); // Collapse others
    await loadContent();
    templateRef.value?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  open.value = newValue;
}

const contentStatus = ref<"idle" | "pending" | "success" | "error">("idle");
async function loadContent() {
  if (["pending", "success"].includes(contentStatus.value)) return;

  error.value = "";
  content.value = "";

  contentStatus.value = "pending";
  try {
    const data = await $fetch(`/api/entries/${props.entry.id}/content`);
    content.value = data.content;
    contentStatus.value = "success";
  } catch (e) {
    contentStatus.value = "error";
    error.value = String(e);
  }
}

const fullContentStatus = ref<"idle" | "pending" | "success" | "error">("idle");
async function loadFullContent() {
  if (["pending", "success"].includes(fullContentStatus.value)) return;

  error.value = "";
  fullContent.value = "";

  fullContentStatus.value = "pending";
  try {
    const data = await $fetch(`/api/entries/${props.entry.id}/full-content`);
    fullContent.value = data.content;
    fullContentStatus.value = "success";
  } catch (e) {
    fullContentStatus.value = "error";
    error.value = String(e);
  }
}

const reading = ref(false);
async function toggleRead() {
  if (reading.value) return;
  error.value = "";
  reading.value = true;
  try {
    await entryStore.updateStatus(props.entry.id, isRead.value ? "unread" : "read");
  } catch (e) {
    error.value = String(e);
  } finally {
    reading.value = false;
  }
}
</script>
