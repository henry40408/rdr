<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />
        <q-toolbar-title>rdr</q-toolbar-title>
        <q-btn dense flat round icon="menu" @click="rightDrawerOpen = !rightDrawerOpen" />
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above v-model="leftDrawerOpen" side="left" bordered> </q-drawer>

    <q-drawer show-if-above v-model="rightDrawerOpen" side="right" bordered>
      <q-list>
        <q-item>
          <q-input v-model="searchQuery" type="search" clearable placeholder="Search" debounce="500">
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </q-item>
        <q-separator spaced />
        <q-item-label header>Status</q-item-label>
        <q-item tag="label" v-ripple>
          <q-item-section side top>
            <q-radio v-model="listStatus" val="unread" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Unread</q-item-label>
          </q-item-section>
        </q-item>
        <q-item tag="label" v-ripple>
          <q-item-section side top>
            <q-radio v-model="listStatus" val="all" />
          </q-item-section>
          <q-item-section>
            <q-item-label>All</q-item-label>
          </q-item-section>
        </q-item>
        <q-item tag="label" v-ripple>
          <q-item-section side top>
            <q-radio v-model="listStatus" val="read" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Read</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <q-banner>
        <q-chip
          v-if="selectedFeedId"
          size="sm"
          color="primary"
          icon="rss_feed"
          outline
          removable
          @remove="selectedFeedId = undefined"
          >Feed: {{ getFilteredFeedTitle() }}</q-chip
        >
        <q-chip
          v-if="selectedCategoryId"
          size="sm"
          color="secondary"
          icon="category"
          outline
          removable
          @remove="selectedCategoryId = undefined"
          >Category: {{ getFilteredCategoryName() }}</q-chip
        >
        <q-chip size="sm" icon="numbers" outline>Entries: {{ countData ? countData.count : "..." }}</q-chip>
        <template v-slot:action>
          <q-btn flat icon="refresh" round @click="resetThenLoad()" />
          <q-btn flat icon="done_all" round @click="markAllAsRead()" />
        </template>
      </q-banner>
      <q-pull-to-refresh @refresh="resetThenLoad">
        <q-infinite-scroll @load="onLoad" :offset="250">
          <q-list separator>
            <q-expansion-item
              clickable
              group="entry"
              v-for="item in allItems"
              :key="item.entry.id"
              @before-show="loadContent(item.entry.id)"
              @hide="markAsRead(item.entry.id)"
            >
              <template v-slot:header>
                <q-item-section side>
                  <q-checkbox
                    size="sm"
                    v-model="entryRead[item.entry.id]"
                    :disable="entryRead[item.entry.id] === 'toggling'"
                    true-value="read"
                    false-value="unread"
                    @click="toggleEntry(item.entry.id)"
                  />
                </q-item-section>
                <q-item-section avatar>
                  <q-avatar size="sm" square v-if="imageExists(item.feed.id)">
                    <img :src="`/api/feeds/${item.feed.id}/image`" onerror="this.remove()" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label lines="3">
                    <MarkedText :text="item.entry.title" :keyword="searchQuery" />
                  </q-item-label>
                  <q-item-label caption>{{ item.feed.title }}</q-item-label>
                </q-item-section>
              </template>

              <q-card>
                <q-card-section>
                  <div class="q-pb-sm q-gutter-sm">
                    <q-chip
                      size="sm"
                      color="primary"
                      icon="rss_feed"
                      outline
                      clickable
                      @click="selectedFeedId = item.feed.id"
                    >
                      Feed: {{ item.feed.title }}
                    </q-chip>
                    <q-chip
                      size="sm"
                      color="secondary"
                      icon="category"
                      outline
                      clickable
                      @click="selectedCategoryId = item.feed.category.id"
                    >
                      Category: {{ item.feed.category.name }}
                    </q-chip>
                    <q-chip size="sm" color="grey" icon="calendar_today" outline
                      >Date: <ClientSideDateTime :datetime="item.entry.date"
                    /></q-chip>
                  </div>
                </q-card-section>
                <q-card-section>
                  <MarkedText
                    v-if="contents[item.entry.id]"
                    class="entry-content"
                    is-html
                    :text="contents[item.entry.id]"
                    :keyword="searchQuery"
                  />
                </q-card-section>
                <q-separator />
                <q-card-actions dense>
                  <q-btn
                    size="sm"
                    flat
                    color="primary"
                    label="Read more"
                    icon="open_in_new"
                    :href="item.entry.link"
                    target="_blank"
                    rel="noopener noreferrer"
                    @click="markAsRead(item.entry.id)"
                  />
                </q-card-actions>
              </q-card>
            </q-expansion-item>
          </q-list>
        </q-infinite-scroll>
      </q-pull-to-refresh>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useRouteQuery } from "@vueuse/router";

const LIMIT = 100;

/** @type {Ref<import('../server/api/entries.post').EntryEntityWithFeed[]>} */
const allItems = ref([]);

/** @type {Ref<{ [key: string]: string }> } */
const contents = ref({});

/** @type {Ref<{ [key: string]: "read" | "unread" | "toggling" }> } */
const entryRead = ref({});

const hasMore = ref(true);
const leftDrawerOpen = ref(false);
const offset = ref(0);
const rightDrawerOpen = ref(false);

/** @type {Ref<"all"|"read"|"unread">} */
const listStatus = useRouteQuery("status", "unread");
/** @type {Ref<string|undefined>} */
const selectedCategoryId = useRouteQuery("categoryId", undefined);
/** @type {Ref<string|undefined>} */
const selectedFeedId = useRouteQuery("feedId", undefined);
/** @type {Ref<string>} */
const searchQuery = useRouteQuery("q", null);

const feedIdsForCount = computed(() => {
  if (selectedFeedId.value) return [selectedFeedId.value];
  if (selectedCategoryId.value && categories.value) {
    const feedIds = categories.value.flatMap((c) =>
      c.id === selectedCategoryId.value ? c.feeds.map((f) => f.id) : [],
    );
    if (feedIds.length > 0) return feedIds;
  }
  return undefined;
});

const { data: categories } = await useFetch("/api/categories");
const { data: countData, execute: refreshCount } = await useFetch("/api/count", {
  method: "POST",
  body: {
    feedIds: feedIdsForCount,
    search: searchQuery,
    status: listStatus,
  },
});
const { data: imagePks } = await useFetch("/api/image-pks");

/**
 * @param {string} entryId
 */
async function loadContent(entryId) {
  try {
    if (contents.value[entryId]) return contents.value[entryId];
    const { content } = await $fetch(`/api/entries/${entryId}/content`);
    contents.value[entryId] = content;
  } catch (e) {
    console.error(e);
  }
}

/**
 * @param {number} [index]
 * @param {(stop?:boolean) => void} [done]
 */
async function onLoad(index, done) {
  const body = {};
  if (selectedFeedId.value) {
    body.feedIds = [selectedFeedId.value];
  } else if (selectedCategoryId.value) {
    const feedIds = categories.value?.flatMap((c) =>
      c.id === selectedCategoryId.value ? c.feeds.map((f) => f.id) : [],
    );
    if (feedIds) body.feedIds = feedIds;
  }
  if (searchQuery.value) body.search = searchQuery.value;
  body.limit = LIMIT;
  body.offset = offset.value;
  body.status = listStatus.value;

  const items = await $fetch("/api/entries", { method: "POST", body });
  if (items.length < LIMIT) hasMore.value = false;
  for (const item of items) {
    allItems.value.push(item);
    entryRead.value[item.entry.id] = item.entry.readAt ? "read" : "unread";
  }
  offset.value += items.length;

  if (done) done();
}

/**
 * @param {(stop?:boolean) => void} [done]
 */
function resetThenLoad(done) {
  allItems.value = [];
  contents.value = {};
  hasMore.value = true;
  offset.value = 0;
  onLoad(undefined, done);
}

watch([listStatus, selectedCategoryId, selectedFeedId, searchQuery], () => {
  resetThenLoad();
});

function getFilteredCategoryName() {
  if (!selectedCategoryId.value) return "None";
  if (!categories.value) return "Unknown";
  const entry = categories.value.find((c) => c.id === selectedCategoryId.value);
  return entry ? entry.name : "Unknown";
}

function getFilteredFeedTitle() {
  if (!selectedFeedId.value) return "None";
  if (!categories.value) return "Unknown";
  const entry = categories.value.flatMap((c) => c.feeds).find((f) => f.id === selectedFeedId.value);
  return entry ? entry.title : "Unknown";
}

/**
 * @param {string} feedId
 * @returns {boolean}
 */
function imageExists(feedId) {
  return (imagePks && imagePks.value?.includes(feedId)) || false;
}

async function markAllAsRead() {
  try {
    const tasks = [];
    for (const item of allItems.value) {
      if (entryRead.value[item.entry.id] === "read") continue;
      const task = async () => {
        entryRead.value[item.entry.id] = "toggling";
        await $fetch(`/api/entries/${item.entry.id}/toggle`, { method: "PUT" });
        entryRead.value[item.entry.id] = "read";
      };
      tasks.push(task());
    }
    await Promise.allSettled(tasks);
    refreshCount();
  } catch (e) {
    console.error("Failed to mark all as read", e);
  }
}

/**
 * @param {string} entryId
 */
async function markAsRead(entryId) {
  if (entryRead.value[entryId] === "read") return;
  entryRead.value[entryId] = "toggling";
  try {
    await $fetch(`/api/entries/${entryId}/toggle`, { method: "PUT" });
    refreshCount();
  } catch (e) {
    console.error("Failed to mark as read", e);
  } finally {
    entryRead.value[entryId] = "read";
  }
}

/**
 * @param {string} entryId
 */
async function toggleEntry(entryId) {
  if (entryRead.value[entryId] === "toggling") return;
  const value = entryRead.value[entryId];
  entryRead.value[entryId] = "toggling";
  try {
    await $fetch(`/api/entries/${entryId}/toggle`, { method: "PUT" });
    refreshCount();
  } catch (e) {
    console.error("Failed to toggle entry", e);
  } finally {
    entryRead.value[entryId] = value;
  }
}
</script>

<style>
.entry-content img {
  max-width: 100%;
  height: auto;
}

.entry-content mark {
  background-color: yellow;
  color: black;
}
</style>
