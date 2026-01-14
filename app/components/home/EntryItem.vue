<template>
  <div ref="entry" :class="{ 'bg-gray-300 dark:bg-black': isRead }" class="border-b last:border-b-0 border-b-gray-500">
    <div v-if="error" class="text-white bg-red-500 p-2">{{ error }}</div>
    <div class="hover:bg-gray-200 hover:dark:bg-gray-800 hover:cursor-pointer" @click="toggle">
      <div class="flex items-stretch pr-2">
        <div class="flex items-center px-4 md:px-6" @click.prevent.stop="toggleRead">
          <input type="checkbox" :checked="isRead" :disabled="reading" @click.prevent.stop="toggleRead" />
        </div>
        <div class="space-y-2 py-2">
          <div class="text-xs md:text-sm">
            <span v-if="isStarred" class="mr-2" title="starred">&#x2B50;</span>
            <a href="#" @click.prevent.stop="entryStore.setFeed(feed.id, category.id)">{{ feed.title }}</a>
            &middot;
            <a href="#" @click.prevent.stop="entryStore.setCategory(category.id)">{{ category.name }}</a>
            &middot; <DurationToNow :datetime="entry.date" />
          </div>
          <div class="flex items-center space-x-2">
            <div>
              <img
                v-if="imageExists"
                alt="Feed Image"
                class="w-4 h-4 align-middle bg-white inline mr-2"
                :src="`/api/images/external/${buildFeedImageKey(feed.id)}`"
              />
              <MarkedText
                :text="entry.title"
                class="text-sm md:text-base"
                :keyword="entryStore.search"
                :class="{ 'line-through text-gray-500': isRead }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="open" class="p-2 space-y-4 max-h-[80vh] overflow-y-auto">
      <div>
        <img
          v-if="imageExists"
          alt="Feed Image"
          class="w-6 h-6 align-middle bg-white inline mr-2"
          :src="`/api/images/external/${buildFeedImageKey(feed.id)}`"
        />
        <ExternalLink :href="entry.link" class="text-lg font-bold">{{ entry.title }}</ExternalLink>
      </div>
      <div>
        <span v-if="entry.author">Author: {{ entry.author }}</span>
      </div>
      <div class="space-x-2">
        <button class="x-button" :disabled="starring" :class="{ 'x-selected': isStarred }" @click="toggleStar">
          {{ starring ? "..." : isStarred ? "unstar" : "star" }}
        </button>
        <button v-if="!['success', 'error'].includes(fullContentStatus)" class="x-button" @click="loadFullContent">
          {{ fullContentStatus === "pending" ? "loading..." : "full content" }}
        </button>
        <button v-else class="x-button x-revert" @click="fullContentStatus = 'idle'">revert original</button>
        <button
          v-if="featuresStore.summarization && !['success', 'error'].includes(summarizationStatus)"
          class="x-button"
          @click="summarize"
        >
          {{ summarizationStatus === "pending" ? "summarizing..." : "summarize" }}
        </button>
        <button v-else-if="featuresStore.summarization" class="x-button x-revert" @click="summarizationStatus = 'idle'">
          reset summary
        </button>
      </div>
      <div>
        <div class="mb-4 space-y-2">
          <UseClipboard v-if="summarizationStatus === 'success'" v-slot="{ copy, copied }" :source="summary">
            <pre class="text-wrap bg-gray-200 dark:bg-gray-800 p-2">{{ summary }}</pre>
            <button class="x-button" @click="copy()">{{ copied ? "copied!" : "copy" }}</button>
          </UseClipboard>
        </div>
        <MarkedText class="x-content" :text="mergedContent" :keyword="entryStore.search" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UseClipboard } from "@vueuse/components";

const categoryStore = useCategoryStore();
const entryStore = useEntryStore();
const featuresStore = useFeaturesStore();

const el = useTemplateRef("entry");

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
const summary = ref("");

const imageExists = computed(
  () =>
    categoryStore.categories.find((c) => c.id === props.category.id)?.feeds.find((f) => f.id === props.feed.id)
      ?.imageExists ?? false,
);
const isRead = computed(() => entryStore.readIds.includes(props.entry.id));
const isStarred = computed(() => entryStore.starredIds.includes(props.entry.id));
const mergedContent = computed(() => {
  if (fullContentStatus.value === "success") return fullContent.value;
  if (contentStatus.value === "success") return content.value;
  return "";
});

function onCollapseOpened() {
  if (!open.value) return;
  open.value = false;
  el.value?.scrollIntoView({ behavior: "smooth", block: "start" });
}
function onCollapseOthers(entryId: number) {
  if (entryId === props.entry.id) return;
  open.value = false;
}
onMounted(() => {
  eventBus.on(EVENT_COLLAPSE_OPENED, onCollapseOpened);
  eventBus.on(EVENT_COLLAPSE_OTHERS, onCollapseOthers);
});
onUnmounted(() => {
  eventBus.off(EVENT_COLLAPSE_OPENED, onCollapseOpened);
  eventBus.off(EVENT_COLLAPSE_OTHERS, onCollapseOthers);
});

async function toggle() {
  const newValue = !open.value;
  if (newValue) {
    eventBus.emit(EVENT_COLLAPSE_OTHERS, props.entry.id); // Collapse others
    await loadContent();
    el.value?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    const newStatus = isRead.value ? "unread" : "read";
    if (newStatus === "read" && open.value) open.value = false;
    await entryStore.updateStatus(props.entry.id, newStatus);
  } catch (e) {
    error.value = String(e);
  } finally {
    reading.value = false;
  }
}

const starring = ref(false);
async function toggleStar() {
  if (starring.value) return;
  error.value = "";
  starring.value = true;
  try {
    await entryStore.updateStatus(props.entry.id, isStarred.value ? "unstarred" : "starred");
  } catch (e) {
    error.value = String(e);
  } finally {
    starring.value = false;
  }
}

const summarizationStatus = ref<"idle" | "pending" | "success" | "error">("idle");
async function summarize() {
  if (["pending", "success"].includes(summarizationStatus.value)) return;

  error.value = "";
  summary.value = "";

  summarizationStatus.value = "pending";
  try {
    const data = await $fetch(`/api/entries/${props.entry.id}/summarize`);
    const [prefixedTitle, content] = (data ?? "").split("\n\n");
    const title = replaceForTiddlyWiki((prefixedTitle ?? "").replace("Title: ", ""));
    summary.value = `${title}

${props.entry.link}

${content}`;
    summarizationStatus.value = "success";
  } catch (e) {
    summarizationStatus.value = "error";
    error.value = String(e);
  }
}
</script>
