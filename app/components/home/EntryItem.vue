<template>
  <q-expansion-item
    group="entry"
    hide-expand-icon
    :model-value="expanded"
    :class="{
      'bg-grey-9': isDark && read,
      'bg-grey-3': !isDark && read,
    }"
    @before-show="loadContent()"
    @update:model-value="entryStore.toggleExpand(entry.id)"
  >
    <template #header>
      <q-item-section side>
        <HomeEntryItemReadToggle :entry="entry" />
      </q-item-section>
      <q-item-section>
        <q-item-label caption>
          {{ feed.title }}
          &middot;
          {{ category.name }}
          &middot;
          <TimeAgo :date="entry.date" />
        </q-item-label>
        <q-item-label>
          <span class="q-mr-sm">
            <q-avatar v-if="imageExists" square size="xs" color="white">
              <img :alt="`Feed image of ${feed.title}`" :src="`/api/images/external/${buildFeedImageKey(feed.id)}`" />
            </q-avatar>
            <q-icon v-else size="xs" name="rss_feed" />
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
              :disabled="!featureStore.summarizationEnabled"
              @click="loadSummarization()"
            />
            <q-btn v-else icon="clear" label="Clear summary" @click="clearSummarization()" />
            <q-btn
              v-if="saveStatus !== 'success'"
              icon="save"
              label="Save"
              :loading="saveStatus === 'pending'"
              :disabled="!featureStore.saveEnabled"
              @click="saveEntry()"
            />
            <q-btn v-else disable icon="check" label="Saved" />
          </q-btn-group>
        </q-card-section>
        <q-card-section v-if="summarizationStatus === 'success'">
          <UseClipboard v-slot="{ copy, copied }" :source="summarization">
            <div class="entry-summary q-mb-md q-pa-md" :class="isDark ? 'bg-grey-8 text-white' : 'bg-grey-2'">
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
          <div v-if="fullContentStatus === 'success' && fullContentData">
            <MarkedText :text="fullContentData.content" />
          </div>
        </q-card-section>
      </q-card>
    </template>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { UseClipboard } from "@vueuse/components";
import { secondsToMilliseconds } from "date-fns";

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

const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");

const categoryStore = useCategoryStore();
const entryStore = useEntryStore();
const featureStore = useFeatureStore();

const content = ref("");
const fullContent = ref("");
const summarization = ref("");

const expanded = computed(() => !!entryStore.expands[props.entry.id]);
const read = computed(() => entryStore.entryReads[props.entry.id] === "read");
const starred = computed(() => entryStore.entryStars[props.entry.id] === "starred");
const imageExists = computed(
  () => categoryStore.categories.flatMap((c) => c.feeds).find((f) => f.id === props.feed.id)?.imageExists,
);

const {
  data: contentData,
  status: contentStatus,
  execute: fetchContent,
} = useFetch(`/api/entries/${props.entry.id}/content`, { immediate: false, timeout: secondsToMilliseconds(30) });

async function loadContent() {
  if (expanded.value && contentStatus.value === "idle") {
    await fetchContent();
    content.value = contentData.value?.content ?? "";
  }
}

const {
  data: fullContentData,
  status: fullContentStatus,
  execute: fetchFullContent,
  clear: clearFullContent,
} = useFetch(`/api/entries/${props.entry.id}/full-content`, { immediate: false, timeout: secondsToMilliseconds(30) });
const showContent = computed(() => {
  if (fullContentStatus.value === "success") return false;
  return contentStatus.value === "success";
});

async function loadFullContent() {
  if (fullContentStatus.value === "idle") {
    await fetchFullContent();
    fullContent.value = fullContentData.value?.content ?? "";
  }
}

const {
  data: summarizationData,
  status: summarizationStatus,
  execute: fetchSummarization,
  clear: clearSummarization,
} = useFetch(`/api/entries/${props.entry.id}/summarize`, { immediate: false, timeout: secondsToMilliseconds(300) });

async function loadSummarization() {
  if (summarizationStatus.value === "idle") {
    await fetchSummarization();
    const [prefixedTitle, content] = (summarizationData.value ?? "").split("\n\n");
    const title = replaceForTiddlyWiki((prefixedTitle ?? "").replace("Title: ", ""));
    summarization.value = `${title}

${props.entry.link}

${content}`;
  }
}

const { status: saveStatus, execute: saveEntry } = useFetch(`/api/entries/${props.entry.id}/save`, {
  method: "POST",
  immediate: false,
});
</script>
