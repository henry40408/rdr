<template>
  <q-layout view="hhh LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />
        <q-toolbar-title>rdr</q-toolbar-title>
        <q-input dark borderless v-model="searchQuery" input-class="text-right" class="q-ml-md q-mr-sm" debounce="500">
          <template v-slot:append>
            <q-icon v-if="!searchQuery" name="search" />
            <q-icon v-else name="clear" class="cursor-pointer" @click="searchQuery = ''" />
          </template>
        </q-input>
        <q-btn dense flat round icon="menu" @click="rightDrawerOpen = !rightDrawerOpen" />
      </q-toolbar>
      <Nav />
    </q-header>

    <q-drawer show-if-above v-model="leftDrawerOpen" side="left" bordered>
      <q-banner>
        <div class="text-h6">Categories</div>
      </q-banner>
      <q-list>
        <template v-for="category in categories" :key="category.id">
          <q-item clickable v-ripple @click="() => $router.push({ path: '/', query: { categoryId: category.id } })">
            <q-item-section>
              <q-item-label>{{ category.name }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-separator />
          <q-item
            v-for="feed in category.feeds"
            :key="feed.id"
            clickable
            v-ripple
            @click="() => $router.push({ path: '/', query: { feedId: feed.id } })"
          >
            <q-item-section avatar>
              <q-avatar size="sm" square v-if="imageExists(feed.id)">
                <img :src="`/api/feeds/${feed.id}/image`" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label lines="1">{{ feed.title }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge color="primary">{{ feedsData?.feeds[feed.id]?.unreadCount || "0" }}</q-badge>
            </q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>

    <q-drawer show-if-above v-model="rightDrawerOpen" side="right" bordered>
      <q-list>
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
      <q-page>
        <q-banner inline-actions>
          <div class="q-my-sm">
            <div class="text-h6" v-if="listStatus === 'unread'">Unread</div>
            <div class="text-h6" v-else-if="listStatus === 'all'">All</div>
            <div class="text-h6" v-else-if="listStatus === 'read'">Read</div>
          </div>
          <div class="q-my-sm">
            <q-chip
              v-if="searchQuery"
              outline
              removable
              color="accent"
              icon="search"
              size="sm"
              @remove="searchQuery = ''"
              >Search: {{ searchQuery }}</q-chip
            >
            <q-chip
              v-if="selectedFeedId"
              outline
              removable
              color="primary"
              icon="rss_feed"
              size="sm"
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
          </div>
          <template v-slot:action>
            <q-btn flat icon="refresh" round @click="resetThenLoad()" />
            <q-btn flat icon="done_all" round @click="markAllAsRead()" />
          </template>
        </q-banner>
        <q-banner class="text-center" v-if="loading">
          <q-spinner color="primary" size="3em" />
        </q-banner>
        <q-banner class="bg-grey-2 text-grey-8" v-if="!loading && items.length === 0">
          <template v-slot:avatar>
            <q-icon name="info" />
          </template>
          No entries found.
        </q-banner>
        <q-pull-to-refresh @refresh="resetThenLoad">
          <q-infinite-scroll @load="onLoad" :offset="250">
            <q-list separator>
              <q-expansion-item
                clickable
                group="entry"
                v-for="(item, index) in items"
                :key="item.entry.id"
                ref="item-list"
                @before-show="loadContent(item.entry.id)"
                @after-show="scrollToContentRef(index)"
              >
                <template v-slot:header>
                  <q-item-section side>
                    <q-checkbox
                      v-model="entryRead[item.entry.id]"
                      size="sm"
                      true-value="read"
                      :disable="entryRead[item.entry.id] === 'toggling'"
                      false-value="unread"
                      @click="toggleEntry(item.entry.id, index)"
                    />
                  </q-item-section>
                  <q-item-section side>
                    <q-avatar size="xs" square v-if="imageExists(item.feed.id)">
                      <img :src="`/api/feeds/${item.feed.id}/image`" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label lines="3">
                      <MarkedText :text="item.entry.title" :keyword="searchQuery" />
                    </q-item-label>
                    <q-item-label caption>{{ item.feed.category.name }} &middot; {{ item.feed.title }}</q-item-label>
                  </q-item-section>
                </template>

                <q-card>
                  <q-card-section>
                    <div class="q-my-sm text-h6">{{ item.entry.title }}</div>
                    <div class="q-my-sm">by {{ item.entry.author }}</div>
                    <div class="q-my-sm">
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
                      <q-chip size="sm" color="accent" icon="calendar_today" outline
                        >Date: <ClientDateTime :datetime="item.entry.date"
                      /></q-chip>
                    </div>
                  </q-card-section>
                  <q-card-section>
                    <MarkedText
                      v-if="contents[item.entry.id]"
                      class="col entry-content"
                      is-html
                      :text="contents[item.entry.id]"
                      :keyword="searchQuery"
                    />
                  </q-card-section>
                  <q-card-actions>
                    <q-btn
                      size="sm"
                      flat
                      icon="check"
                      color="primary"
                      label="Mark as read and collapse"
                      @click="markAsReadAndCollapse(item.entry.id, index)"
                    />
                    <q-btn
                      size="sm"
                      flat
                      color="primary"
                      label="Collapse"
                      icon="unfold_less"
                      @click="collapseItem(index)"
                    />
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
              <q-item v-if="!hasMore && items.length > 0">
                <q-item-section>
                  <q-item-label class="text-center text-grey-8">End of list</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-infinite-scroll>
        </q-pull-to-refresh>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useRouteQuery } from "@vueuse/router";

const LIMIT = 100;

const itemRefs = useTemplateRef("item-list");

/** @type {Ref<import('../server/api/entries.get').EntryEntityWithFeed[]>} */
const items = ref([]);

/** @type {Ref<{ [key: string]: string }> } */
const contents = ref({});

/** @type {Ref<Record<string,"read"|"toggling"|"unread">>} */
const entryRead = ref({});

const hasMore = ref(true);
const leftDrawerOpen = ref(false);
const loading = ref(false);
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

const countQuery = computed(() => {
  const query = {};
  if (selectedFeedId.value) {
    query.selectedType = "feed";
    query.selectedId = selectedFeedId.value;
  } else if (selectedCategoryId.value) {
    query.selectedType = "category";
    query.selectedId = selectedCategoryId.value;
  }
  if (searchQuery.value) query.search = searchQuery.value;
  if (listStatus.value) query.status = listStatus.value;
  return query;
});

const { data: categories } = await useFetch("/api/categories");
const { data: countData, execute: refreshCount } = await useFetch("/api/count", {
  query: countQuery,
});
const { data: imagePks } = await useFetch("/api/image-pks");
const { data: feedsData, execute: refreshFeedData } = await useFetch("/api/feeds/data");

/**
 * @param {number} index
 */
function collapseItem(index) {
  // @ts-expect-error
  itemRefs.value?.[index]?.hide();
}

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

async function load() {
  const query = {};
  if (selectedFeedId.value) {
    query.selectedType = "feed";
    query.selectedId = selectedFeedId.value;
  } else if (selectedCategoryId.value) {
    query.selectedType = "category";
    query.selectedId = selectedCategoryId.value;
  }
  if (searchQuery.value) query.search = searchQuery.value;
  if (listStatus.value) query.status = listStatus.value;
  query.limit = LIMIT;
  query.offset = offset.value;

  loading.value = true;
  try {
    const newItems = await $fetch("/api/entries", { query });
    if (newItems) {
      for (const item of newItems) {
        items.value.push(item);
        entryRead.value[item.entry.id] = item.entry.readAt ? "read" : "unread";
      }
      if (newItems.length < LIMIT) hasMore.value = false;
    }
  } catch (e) {
    console.error(e);
    hasMore.value = false;
  } finally {
    loading.value = false;
  }
}
await load();

/**
 * @param {string} entryId
 */
async function loadContent(entryId) {
  try {
    if (contents.value[entryId]) return contents.value[entryId];
    const { content } = await $fetch(`/api/entries/${entryId}/content`);
    contents.value[entryId] = content;
  } catch (e) {
    console.error("Failed to load content for entry", e);
  }
}

/**
 * @param {number} [_index]
 * @param {(stop?:boolean) => void} [done]
 */
async function onLoad(_index, done) {
  if (!hasMore.value) {
    if (done) done(true);
    return;
  }
  offset.value += LIMIT;
  await load();
  if (done) done();
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
    for (const item of items.value) {
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
    refreshFeedData();
  } catch (e) {
    console.error("Failed to mark all as read", e);
  }
}

/**
 * @param {string} entryId
 */
async function markAsRead(entryId) {
  if (entryRead.value[entryId] === "read") return;
  const oldValue = entryRead.value[entryId];
  try {
    entryRead.value[entryId] = "toggling";
    await $fetch(`/api/entries/${entryId}/toggle`, { method: "PUT" });
    entryRead.value[entryId] = "read";
    refreshCount();
    refreshFeedData();
  } catch (e) {
    console.error("Failed to mark as read", e);
    entryRead.value[entryId] = oldValue;
  }
}

/**
 * @param {string} entryId
 * @param {number} index
 */
async function markAsReadAndCollapse(entryId, index) {
  await markAsRead(entryId);
  collapseItem(index);
  scrollToContentRef(index);
}

/**
 * @param {(stop?:boolean) => void} [done]
 */
async function resetThenLoad(done) {
  contents.value = {};
  hasMore.value = true;
  items.value = [];
  offset.value = 0;

  await load();
  if (done) done();
}
watch([listStatus, selectedCategoryId, selectedFeedId, searchQuery], () => {
  resetThenLoad();
});

/**
 * @param {number} index
 */
function scrollToContentRef(index) {
  // @ts-expect-error
  itemRefs.value?.[index]?.$el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * @param {string} entryId
 * @param {number} index
 */
async function toggleEntry(entryId, index) {
  if (entryRead.value[entryId] === "toggling") return;

  // status of checkbox is already changed by the time this function is called
  const value = entryRead.value[entryId];

  entryRead.value[entryId] = "toggling";
  try {
    await $fetch(`/api/entries/${entryId}/toggle`, { method: "PUT" });
    refreshCount();
    refreshFeedData();
  } catch (e) {
    console.error("Failed to toggle entry", e);
  } finally {
    entryRead.value[entryId] = value;
    collapseItem(index);
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
