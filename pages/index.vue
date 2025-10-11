<template>
  <q-layout view="hhh LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />
        <q-toolbar-title>
          <q-avatar>
            <q-icon name="rss_feed" />
          </q-avatar>
          rdr
        </q-toolbar-title>
        <q-input v-model="searchQuery" dark borderless input-class="text-right" class="q-ml-md q-mr-sm" debounce="500">
          <template #append>
            <q-icon v-if="!searchQuery" name="search" />
            <q-icon v-else name="clear" class="cursor-pointer" @click="searchQuery = ''" />
          </template>
        </q-input>
        <q-btn dense flat round icon="menu" @click="rightDrawerOpen = !rightDrawerOpen" />
      </q-toolbar>
      <NavTabs />
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above side="left" bordered>
      <q-list padding>
        <q-item>
          <q-item-section header>
            <q-item-label class="text-h5">Categories</q-item-label>
            <q-item-label caption>Browse by category</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <ClientOnly>
              <q-toggle v-model="hideEmpty" label="Hide empty" />
            </ClientOnly>
          </q-item-section>
        </q-item>
        <ClientOnly>
          <template v-for="category in categories" :key="category.id">
            <template v-if="!hideEmpty || categoryUnreadCount(category.id) > 0">
              <q-item v-ripple clickable @click="() => $router.push({ path: '/', query: { categoryId: category.id } })">
                <q-item-section>
                  <q-item-label>{{ category.name }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge color="primary" :outline="!categoryUnreadCount(category.id)">{{
                    categoryUnreadCount(category.id)
                  }}</q-badge>
                </q-item-section>
              </q-item>
              <q-separator />
              <template v-for="feed in category.feeds" :key="feed.id">
                <q-item
                  v-if="!hideEmpty || feedUnreadCount(feed.id) > 0"
                  v-ripple
                  clickable
                  @click="() => $router.push({ path: '/', query: { feedId: feed.id } })"
                >
                  <q-item-section avatar>
                    <q-avatar v-if="imageExists(feed.id)" size="sm" square>
                      <!-- prettier-ignore -->
                      <img :src="`/api/images/${buildFeedImageKey(feed.id)}`">
                    </q-avatar>
                    <q-icon v-else name="rss_feed" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label lines="1">{{ feed.title }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge color="primary" :outline="!feedUnreadCount(feed.id)">{{
                      feedUnreadCount(feed.id)
                    }}</q-badge>
                  </q-item-section>
                </q-item>
              </template>
            </template>
          </template>
          <q-item v-if="!categories?.length">
            <q-item-section>
              <q-item-label class="text-subtitle2">No categories found.</q-item-label>
              <q-item-label caption>
                You can add new feeds on the
                <router-link to="/settings">settings page</router-link>.
              </q-item-label>
            </q-item-section>
          </q-item>
        </ClientOnly>
      </q-list>
    </q-drawer>

    <q-drawer v-model="rightDrawerOpen" show-if-above side="right" bordered>
      <q-list>
        <q-item-label header>Status</q-item-label>
        <q-item v-ripple tag="label">
          <q-item-section side top>
            <q-radio v-model="listStatus" val="unread" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Unread</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-ripple tag="label">
          <q-item-section side top>
            <q-radio v-model="listStatus" val="all" />
          </q-item-section>
          <q-item-section>
            <q-item-label>All</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-ripple tag="label">
          <q-item-section side top>
            <q-radio v-model="listStatus" val="read" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Read</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-ripple tag="label">
          <q-item-section side top>
            <q-radio v-model="listStatus" val="starred" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Starred</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <q-page>
        <q-list padding>
          <q-item>
            <q-item-section header>
              <q-item-label>
                <div class="q-gutter-sm row items-center">
                  <div class="text-h5">
                    <span v-if="listStatus === 'unread'">Unread</span>
                    <span v-else-if="listStatus === 'read'">Read</span>
                    <span v-else-if="listStatus === 'starred'">Starred</span>
                    <span v-else>All</span>
                  </div>
                  <q-badge>{{ countData ? countData.count : "..." }}</q-badge>
                  <div>
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
                      v-if="searchQuery"
                      outline
                      removable
                      color="accent"
                      icon="search"
                      size="sm"
                      @remove="searchQuery = ''"
                      >Search: {{ searchQuery }}</q-chip
                    >
                  </div>
                </div>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <div>
                <q-btn flat icon="refresh" round @click="resetThenLoad()" />
                <q-btn flat icon="done_all" round @click="markAllAsRead()" />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
        <q-card v-if="loading" flat>
          <q-card-section class="row justify-center">
            <q-spinner color="primary" size="3em" />
          </q-card-section>
        </q-card>
        <q-banner v-if="!loading && items.length === 0" class="bg-grey-2 text-grey-8">
          <template #avatar>
            <q-icon name="info" />
          </template>
          <div>No entries found.</div>
          <div class="text-caption">
            Try adjusting your filters or <router-link to="/settings">add new feeds</router-link>.
          </div>
        </q-banner>
        <q-pull-to-refresh @refresh="resetThenLoad">
          <q-infinite-scroll :offset="250" @load="onLoad">
            <q-list separator>
              <q-expansion-item
                v-for="(item, index) in items"
                :key="item.entry.id"
                ref="item-list"
                :class="{ 'bg-grey-3': entryRead[item.entry.id] === 'read' }"
                clickable
                group="entry"
                @before-show="loadContent(item.entry.id)"
                @after-show="scrollToContentRef(index)"
              >
                <template #header>
                  <q-item-section side>
                    <q-checkbox
                      v-model="entryRead[item.entry.id]"
                      checked-icon="drafts"
                      color="grey-6"
                      unchecked-icon="mail"
                      true-value="read"
                      :disable="entryRead[item.entry.id] === 'toggling'"
                      false-value="unread"
                      @click="toggleReadEntry(item.entry.id, index)"
                    />
                  </q-item-section>
                  <q-item-section side>
                    <q-avatar size="sm" square>
                      <!-- prettier-ignore -->
                      <img v-if="imageExists(item.feed.id)" :src="`/api/images/${buildFeedImageKey(item.feed.id)}`">
                      <q-icon v-else size="sm" name="rss_feed" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label lines="3">
                      <MarkedText :text="item.entry.title" :keyword="searchQuery" />
                    </q-item-label>
                    <q-item-label lines="2" caption
                      >{{ item.feed.category.name }} &middot; {{ item.feed.title }} &middot;
                      <ClientAgo :datetime="item.entry.date"
                    /></q-item-label>
                  </q-item-section>
                </template>

                <q-card>
                  <q-card-section>
                    <div class="q-my-sm text-h5">
                      {{ item.entry.title }}
                      <q-btn
                        flat
                        size="sm"
                        round
                        icon="open_in_new"
                        :href="item.entry.link"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    </div>
                    <div class="q-my-sm">by {{ item.entry.author }}</div>
                    <div class="q-my-sm">
                      <q-chip
                        size="sm"
                        :color="entryStar[item.entry.id] === 'starred' ? 'yellow' : 'grey'"
                        :icon="entryStar[item.entry.id] === 'starred' ? 'star' : 'star_border'"
                        :outline="entryStar[item.entry.id] === 'unstarred'"
                        clickable
                        :disable="entryStar[item.entry.id] === 'starring'"
                        @click="toggleStarEntry(item.entry.id)"
                      >
                        {{ entryStar[item.entry.id] === "starred" ? "Starred" : "Not starred" }}
                      </q-chip>
                      <q-chip
                        size="sm"
                        color="secondary"
                        icon="category"
                        outline
                        clickable
                        @click="selectedCategoryId = String(item.feed.category.id)"
                      >
                        Category: {{ item.feed.category.name }}
                      </q-chip>
                      <q-chip
                        size="sm"
                        color="primary"
                        icon="rss_feed"
                        outline
                        clickable
                        @click="selectedFeedId = String(item.feed.id)"
                      >
                        Feed: {{ item.feed.title }}
                      </q-chip>
                      <q-chip size="sm" color="accent" icon="calendar_today" outline
                        >Date: <ClientDateTime :datetime="item.entry.date"
                      /></q-chip>
                    </div>
                  </q-card-section>
                  <q-card-section>
                    <MarkedText
                      v-if="getContent(item.entry.id)"
                      class="col entry-content"
                      is-html
                      :text="getContent(item.entry.id)"
                      :keyword="searchQuery"
                    />
                  </q-card-section>
                  <q-card-actions>
                    <q-btn
                      size="sm"
                      flat
                      icon="check"
                      color="primary"
                      label="Mark as read"
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
                      v-if="!contents[downloadedKey(item.entry.id)]"
                      size="sm"
                      flat
                      color="primary"
                      label="Download"
                      icon="file_download"
                      :loading="downloading"
                      @click="downloadContent(item.entry.id)"
                    />
                    <q-btn
                      v-else
                      size="sm"
                      flat
                      color="primary"
                      label="See original"
                      icon="undo"
                      @click="contents[downloadedKey(item.entry.id)] = ''"
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
import { useQuasar } from "quasar";
import { useRouteQuery } from "@vueuse/router";
import { useLocalSettings } from "./local-settings";

const LIMIT = 100;

const $q = useQuasar();
const itemRefs = useTemplateRef("item-list");
const { hideEmpty } = useLocalSettings();

const downloading = ref(false);
const hasMore = ref(true);
const leftDrawerOpen = ref(false);
const loading = ref(false);
const offset = ref(0);
const rightDrawerOpen = ref(false);

/** @type {Ref<"all"|"read"|"unread"|"starred">} */
const listStatus = useRouteQuery("status", "unread");
/** @type {Ref<string|undefined>} */
const selectedCategoryId = useRouteQuery("categoryId", undefined);
/** @type {Ref<string|undefined>} */
const selectedFeedId = useRouteQuery("feedId", undefined);
/** @type {Ref<string>} */
const searchQuery = useRouteQuery("q", null);

/** @type {Ref<import('../server/api/entries.get').EntryEntityWithFeed[]>} */
const items = ref([]);

/** @type {Ref<{ [key: string]: string }> } */
const contents = ref({});

/** @type {Ref<Record<string,"read"|"toggling"|"unread">>} */
const entryRead = ref({});

/** @type {Ref<Record<string,"unstarred"|"starring"|"starred">>} */
const entryStar = ref({});

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
useHead(() => ({
  title: selectedFeedId.value
    ? `(${countData.value?.count || 0}) Feed: ${getFilteredFeedTitle()} - rdr`
    : selectedCategoryId.value
      ? `(${countData.value?.count || 0}) Category: ${getFilteredCategoryName()} - rdr`
      : `(${countData.value?.count || 0}) rdr`,
}));
const { data: imagePks } = await useFetch("/api/images/primary-keys");
const { data: feedsData, execute: refreshFeedData } = await useFetch("/api/feeds/data");

/**
 * @param {number} categoryId
 * @returns {number}
 */
function categoryUnreadCount(categoryId) {
  if (!feedsData.value) return 0;
  const feedIds = categories.value?.filter((c) => c.id === categoryId).flatMap((c) => c.feeds.map((f) => f.id)) || [];
  return feedIds.reduce((sum, feedId) => sum + (feedsData.value?.feeds[feedId]?.unreadCount || 0), 0);
}

/**
 * @param {number} entryId
 * @returns {string}
 */
function contentKey(entryId) {
  return `content:${entryId}`;
}

/**
 * @param {number} entryId
 * @returns {string}
 */
function downloadedKey(entryId) {
  return `downloaded:${entryId}`;
}

/**
 * @param {number} entryId
 */
async function downloadContent(entryId) {
  const key = downloadedKey(entryId);
  try {
    if (contents.value[key]) return;
    downloading.value = true;
    const parsed = await $fetch(`/api/entries/${entryId}/download`);
    if (parsed && parsed.content) contents.value[key] = parsed.content;
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to download entry content: ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
  } finally {
    downloading.value = false;
  }
}

/**
 * @param {number} entryId
 * @returns {string}
 */
function getContent(entryId) {
  return contents.value[downloadedKey(entryId)] || contents.value[contentKey(entryId)] || "";
}

/**
 * @param {number} index
 */
function collapseItem(index) {
  // @ts-expect-error: hide exists
  itemRefs.value?.[index]?.hide();
}

/**
 * @param {number} feedId
 * @returns {number}
 */
function feedUnreadCount(feedId) {
  if (!feedsData.value) return 0;
  return feedsData.value?.feeds[feedId]?.unreadCount || 0;
}

function getFilteredCategoryName() {
  if (!selectedCategoryId.value) return "None";
  if (!categories.value) return "Unknown";
  const entry = categories.value.find((c) => c.id === Number(selectedCategoryId.value));
  return entry ? entry.name : "Unknown";
}

function getFilteredFeedTitle() {
  if (!selectedFeedId.value) return "None";
  if (!categories.value) return "Unknown";
  const entry = categories.value.flatMap((c) => c.feeds).find((f) => f.id === Number(selectedFeedId.value));
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
        entryStar.value[item.entry.id] = item.entry.starredAt ? "starred" : "unstarred";
      }
      if (newItems.length < LIMIT) hasMore.value = false;
    }
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to load entries: ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
    hasMore.value = false;
  } finally {
    loading.value = false;
  }
}
await load();

/**
 * @param {number} entryId
 */
async function loadContent(entryId) {
  const key = contentKey(entryId);
  try {
    if (contents.value[key]) return contents.value[key];
    const { content } = await $fetch(`/api/entries/${entryId}/content`);
    contents.value[key] = content;
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to load entry content: ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
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
 * @param {number} feedId
 * @returns {boolean}
 */
function imageExists(feedId) {
  const key = buildFeedImageKey(feedId);
  return (imagePks && imagePks.value?.includes(key)) || false;
}

async function markAllAsRead() {
  const tasks = [];
  for (const item of items.value) {
    if (entryRead.value[item.entry.id] === "read") continue;
    const task = async () => {
      const value = entryRead.value[item.entry.id];
      try {
        entryRead.value[item.entry.id] = "toggling";
        await $fetch(`/api/entries/${item.entry.id}/toggle`, { method: "PUT" });
        entryRead.value[item.entry.id] = "read";
      } catch (err) {
        $q.notify({
          type: "negative",
          message: `Failed to mark entry ${item.entry.id} as read: ${err}`,
          actions: [{ icon: "close", color: "white" }],
        });
        entryRead.value[item.entry.id] = value;
      }
    };
    tasks.push(task());
  }
  await Promise.all(tasks);
  refreshCount();
  refreshFeedData();
}

/**
 * @param {number} entryId
 */
async function markAsRead(entryId) {
  if (entryRead.value[entryId] === "read") return;
  const value = entryRead.value[entryId];
  try {
    entryRead.value[entryId] = "toggling";
    await $fetch(`/api/entries/${entryId}/toggle`, { method: "PUT" });
    entryRead.value[entryId] = "read";
    refreshCount();
    refreshFeedData();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to mark entry ${entryId} as read: ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
    entryRead.value[entryId] = value;
  }
}

/**
 * @param {number} entryId
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
  // @ts-expect-error: scrollIntoView exists
  itemRefs.value?.[index]?.$el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * @param {number} entryId
 * @param {number} index
 */
async function toggleReadEntry(entryId, index) {
  if (entryRead.value[entryId] === "toggling") return;

  // status of checkbox is already changed by the time this function is called
  const value = entryRead.value[entryId];

  entryRead.value[entryId] = "toggling";
  try {
    await $fetch(`/api/entries/${entryId}/toggle`, { method: "PUT" });
    refreshCount();
    refreshFeedData();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to toggle entry ${entryId}: ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
  } finally {
    entryRead.value[entryId] = value;
    if (value === "read") collapseItem(index);
  }
}

/**
 * @param {number} entryId
 */
async function toggleStarEntry(entryId) {
  if (entryStar.value[entryId] === "starring") return;

  const value = entryStar.value[entryId];
  entryStar.value[entryId] = "starring";
  try {
    await $fetch(`/api/entries/${entryId}/star`, { method: "PUT" });
    refreshCount();
    refreshFeedData();
    entryStar.value[entryId] = value === "starred" ? "unstarred" : "starred";
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to toggle star for entry ${entryId}: ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
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
