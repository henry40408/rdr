<template>
  <q-expansion-item
    ref="entry-item"
    group="entry"
    hide-expand-icon
    :model-value="expanded"
    :class="{
      'bg-grey-9': $q.dark.isActive && read,
      'bg-grey-3': !$q.dark.isActive && read,
    }"
    @before-show="loadContent()"
    @after-show="scrollToEntry()"
    @update:model-value="entryStore.toggleExpand(entry.id)"
  >
    <template #header>
      <q-item-section side>
        <HomeEntryItemReadToggle :entry="entry" @after-read="scrollToEntry" />
      </q-item-section>
      <q-item-section>
        <q-item-label caption>
          {{ feed.title }}
          &middot;
          {{ category.name }}
          &middot;
          <TimeAgo :datetime="entry.date" />
        </q-item-label>
        <q-item-label>
          <span class="q-mr-sm">
            <FeedIcon :feed="{ ...feed, imageExists }" />
          </span>
          <MarkedText :text="entry.title" :keyword="entryStore.search" />
        </q-item-label>
      </q-item-section>
      <q-item-section top side>
        <div :class="$q.screen.lt.md ? 'column' : ''">
          <q-icon v-if="starred" size="xs" name="star" color="accent" />
          <q-spinner v-if="fullContentStatus === 'pending'" size="xs" />
          <q-icon v-if="fullContentStatus === 'success'" size="xs" name="description" />
          <q-spinner v-if="summarizationStatus === 'pending'" size="xs" />
          <q-icon v-if="summarizationStatus === 'success'" size="xs" name="psychology" />
        </div>
      </q-item-section>
    </template>

    <template #default>
      <q-card>
        <q-card-section class="q-pb-xs">
          <q-chip clickable color="primary" text-color="white" @click="entryStore.setCategoryId(category.id)">
            {{ category.name }}
          </q-chip>
          <q-chip clickable color="secondary" text-color="white" @click="entryStore.setFeedId(category.id, feed.id)">
            <q-avatar><q-icon name="rss_feed" /></q-avatar>
            {{ feed.title }}
          </q-chip>
        </q-card-section>
        <q-card-section class="row items-center q-gutter-xs q-py-xs">
          <div class="text-h6">
            <ExternalLink :href="entry.link">
              <HomeEntryItemStarToggle :entry="entry" />
              <MarkedText :text="entry.title" :keyword="entryStore.search" />
            </ExternalLink>
          </div>
        </q-card-section>
        <q-card-section class="q-pt-xs">
          <q-chip v-if="entry.author" outline>
            <q-avatar><q-icon name="person" /></q-avatar>
            {{ entry.author }}
          </q-chip>
          <q-chip outline>
            <q-avatar><q-icon name="event" /></q-avatar>
            <DateTime :datetime="entry.date" />
          </q-chip>
        </q-card-section>
        <q-card-section>
          <q-btn-group push spread :class="$q.screen.lt.sm ? 'column' : ''">
            <q-btn
              v-if="fullContentStatus !== 'success'"
              icon="download"
              label="Full content"
              :loading="fullContentStatus === 'pending'"
              @click="loadFullContent()"
            />
            <q-btn v-else icon="clear" label="Clear full content" @click="clearFullContent()" />
            <q-btn
              v-if="summarizationStatus !== 'success'"
              icon="psychology"
              label="Summarize"
              :loading="summarizationStatus === 'pending'"
              :disabled="!userSettingsStore.features?.summarization"
              @click="loadSummarization()"
            />
            <q-btn v-else icon="clear" label="Clear summary" @click="clearSummarization()" />
            <q-btn
              v-if="saveStatus !== 'success'"
              icon="save"
              label="Save"
              :loading="saveStatus === 'pending'"
              :disabled="!userSettingsStore.features?.save"
              @click="saveEntry()"
            />
            <q-btn v-else disable icon="check" label="Saved" />
          </q-btn-group>
        </q-card-section>
        <q-card-section v-if="summarizationStatus === 'success'">
          <UseClipboard v-slot="{ copy, copied }" :source="summarization">
            <div class="entry-summary q-mb-md q-pa-md" :class="$q.dark.isActive ? 'bg-grey-9 text-white' : 'bg-grey-3'">
              <pre>{{ summarization }}</pre>
            </div>
            <q-btn color="secondary" :label="copied ? 'Copied!' : 'Copy'" @click="copy()" />
          </UseClipboard>
        </q-card-section>
        <q-card-section class="entry-content">
          <div v-if="contentStatus === 'pending'" class="q-gutter-sm">
            <q-skeleton animated width="80%" />
            <q-skeleton animated width="90%" />
            <q-skeleton animated width="70%" />
          </div>
          <div v-if="showContent">
            <MarkedText :text="content" :keyword="entryStore.search" />
          </div>
          <div v-if="fullContentStatus === 'success' && fullContent">
            <MarkedText :text="fullContent" />
          </div>
        </q-card-section>
      </q-card>
    </template>
  </q-expansion-item>
</template>

<script setup lang="ts">
import type { QExpansionItem } from "quasar";
import { UseClipboard } from "@vueuse/components";

const props = defineProps<{
  entry: {
    id: number;
    title: string;
    date: string;
    link: string;
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

const entryItemRef = useTemplateRef<QExpansionItem>("entry-item");

function scrollToEntry() {
  entryItemRef.value?.$el.scrollIntoView({ behavior: "smooth" });
}

const categoryStore = useCategoryStore();
const entryStore = useEntryStore();
const userSettingsStore = useUserSettingsStore();

const content = ref("");
const fullContent = ref("");
const summarization = ref("");

const expanded = computed(() => !!entryStore.expands[props.entry.id]);
const read = computed(() => entryStore.entryReads[props.entry.id] === "read");
const starred = computed(() => entryStore.entryStars[props.entry.id] === "starred");
const imageExists = computed(
  () => categoryStore.categories.flatMap((c) => c.feeds).find((f) => f.id === props.feed.id)?.imageExists ?? false,
);

const contentStatus = ref<"idle" | "pending" | "success" | "error">("idle");
async function loadContent() {
  try {
    if (expanded.value && contentStatus.value === "idle") {
      contentStatus.value = "pending";
      const data = await $fetch(`/api/entries/${props.entry.id}/content`);
      content.value = data?.content ?? "";
      contentStatus.value = "success";
    }
  } catch {
    contentStatus.value = "error";
  }
}

const fullContentStatus = ref<"idle" | "pending" | "success" | "error">("idle");
async function loadFullContent() {
  if (fullContentStatus.value === "idle") {
    fullContentStatus.value = "pending";
    try {
      const data = await $fetch(`/api/entries/${props.entry.id}/full-content`);
      fullContent.value = data?.content ?? "";
      fullContentStatus.value = "success";
    } catch {
      fullContentStatus.value = "error";
    }
  }
}
function clearFullContent() {
  fullContent.value = "";
  fullContentStatus.value = "idle";
}

const showContent = computed(() => {
  if (fullContentStatus.value === "success") return false;
  return contentStatus.value === "success";
});

const summarizationStatus = ref<"idle" | "pending" | "success" | "error">("idle");
async function loadSummarization() {
  try {
    if (summarizationStatus.value === "idle") {
      summarizationStatus.value = "pending";
      const data = await $fetch(`/api/entries/${props.entry.id}/summarize`);
      summarizationStatus.value = "success";

      const [prefixedTitle, content] = (data ?? "").split("\n\n");
      const title = replaceForTiddlyWiki((prefixedTitle ?? "").replace("Title: ", ""));
      summarization.value = `${title}

${props.entry.link}

${content}`;
    }
  } catch {
    summarizationStatus.value = "error";
  }
}
function clearSummarization() {
  summarization.value = "";
  summarizationStatus.value = "idle";
}

const saveStatus = ref<"idle" | "pending" | "success" | "error">("idle");
async function saveEntry() {
  saveStatus.value = "pending";
  try {
    await $fetch(`/api/entries/${props.entry.id}/save`, { method: "POST" });
    saveStatus.value = "success";
  } catch {
    saveStatus.value = "error";
  }
}
</script>
