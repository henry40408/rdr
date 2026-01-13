<template>
  <div ref="entry" :class="{ 'bg-gray-300 dark:bg-black': isRead }" class="border-b last:border-b-0 border-b-gray-500">
    <div v-if="error" class="text-white bg-red-500 p-2">{{ error }}</div>
    <div class="p-2 space-y-2">
      <div class="text-sm">
        <a href="#" @click.prevent="entryStore.setFeed(feed.id, category.id)">{{ feed.title }}</a>
        &middot;
        <a href="#" @click.prevent="entryStore.setCategory(category.id)">{{ category.name }}</a>
        &middot; <DurationToNow :datetime="entry.date" />
      </div>
      <div class="flex items-center gap-2">
        <input type="checkbox" :checked="isRead" :disabled="reading" @change="toggleRead" />
        <img
          v-if="imageExists"
          alt="Feed Image"
          class="w-4 h-4 bg-white"
          :src="`/api/images/external/${buildFeedImageKey(feed.id)}`"
        />
        <ExternalLink
          :href="entry.link"
          :class="{
            'line-through text-gray-500': isRead,
          }"
          >{{ entry.title }}</ExternalLink
        >
      </div>
      <details :open="open">
        <summary @click.prevent="toggle">content</summary>
        <div class="mt-2 space-y-2">
          <div>
            <button v-if="fullContentStatus === 'idle'" class="x-button" @click="loadFullContent">full content</button>
            <button v-if="fullContentStatus !== 'idle'" class="x-button x-revert" @click="fullContentStatus = 'idle'">
              read original
            </button>
          </div>
          <div>
            <div v-if="fullContentStatus !== 'idle'">
              <MarkedText class="x-content" :text="fullContent" />
              <div v-if="fullContentStatus === 'pending'">Loading...</div>
              <div v-else-if="fullContentStatus === 'error'">{{ fullContent }}</div>
            </div>
            <div v-else>
              <MarkedText v-if="contentStatus === 'success'" :text="content" class="x-content" />
              <div v-if="contentStatus === 'pending'">Loading...</div>
              <div v-else-if="contentStatus === 'error'">{{ content }}</div>
            </div>
          </div>
        </div>
      </details>
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
