<template>
  <q-layout view="hhh LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />
        <q-toolbar-title>
          <q-avatar>
            <q-icon name="rss_feed" />
          </q-avatar>
          rdr
        </q-toolbar-title>
        <q-input v-model="searchQuery" dark borderless debounce="500" class="q-ml-md q-mr-sm" input-class="text-right">
          <template #append>
            <q-icon v-if="!searchQuery" name="search" />
            <q-icon v-else name="clear" class="cursor-pointer" @click="searchQuery = ''" />
          </template>
        </q-input>
        <q-btn flat dense round icon="menu" @click="rightDrawerOpen = !rightDrawerOpen" />
      </q-toolbar>
      <NavTabs />
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered side="left" show-if-above>
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
                  <q-item-section side>
                    <q-avatar v-if="imageExists(feed.id)" square size="xs">
                      <q-img :src="`/api/images/${buildFeedImageKey(feed.id)}`" />
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

    <q-drawer v-model="rightDrawerOpen" bordered side="right" show-if-above>
      <q-list>
        <q-item-label header>Status</q-item-label>
        <q-item v-ripple tag="label">
          <q-item-section top side>
            <q-radio v-model="listStatus" val="unread" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Unread</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-ripple tag="label">
          <q-item-section top side>
            <q-radio v-model="listStatus" val="all" />
          </q-item-section>
          <q-item-section>
            <q-item-label>All</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-ripple tag="label">
          <q-item-section top side>
            <q-radio v-model="listStatus" val="read" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Read</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-ripple tag="label">
          <q-item-section top side>
            <q-radio v-model="listStatus" val="starred" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Starred</q-item-label>
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item-label header>Page size</q-item-label>
        <q-item>
          <q-item-section side>
            {{ limit }}
          </q-item-section>
          <q-item-section>
            <q-slider v-model.number="limit" filled markers :min="100" :max="1000" :step="100" type="number" />
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
                      outline
                      removable
                      icon="category"
                      color="secondary"
                      @remove="selectedCategoryId = undefined"
                      >Category: {{ getFilteredCategoryName() }}</q-chip
                    >
                    <q-chip
                      v-if="selectedFeedId"
                      outline
                      removable
                      color="primary"
                      icon="rss_feed"
                      @remove="selectedFeedId = undefined"
                      >Feed: {{ getFilteredFeedTitle() }}</q-chip
                    >
                    <q-chip
                      v-if="searchQuery"
                      outline
                      removable
                      icon="search"
                      color="accent"
                      @remove="searchQuery = ''"
                    >
                      Search: {{ searchQuery }}
                    </q-chip>
                  </div>
                </div>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <div>
                <q-btn flat round icon="refresh" @click="resetThenLoad()" />
                <q-btn flat round icon="done_all" @click="markAllAsRead()" />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
        <q-card v-if="loading" flat>
          <q-card-section class="row justify-center">
            <q-spinner size="3em" color="primary" />
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
                ref="item-list"
                :key="item.entry.id"
                clickable
                group="entry"
                :class="{ 'bg-grey-3': entryRead[item.entry.id] === 'read' }"
                @after-show="scrollToContentRef(index)"
                @before-show="loadContent(item.entry.id)"
              >
                <template #header>
                  <q-item-section side>
                    <q-checkbox
                      v-model="entryRead[item.entry.id]"
                      color="grey"
                      true-value="read"
                      false-value="unread"
                      checked-icon="drafts"
                      unchecked-icon="mail"
                      :disable="entryRead[item.entry.id] === 'toggling'"
                      @click="toggleReadEntry(item.entry.id, index)"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label lines="3">
                      <MarkedText :keyword="searchQuery" :text="item.entry.title" />
                    </q-item-label>
                    <q-item-label caption lines="2">
                      <q-img
                        v-if="imageExists(item.feed.id)"
                        width=".75rem"
                        class="q-mr-sm"
                        height=".75rem"
                        :src="`/api/images/${buildFeedImageKey(item.feed.id)}`"
                      />
                      {{ item.feed.category.name }} &middot; {{ item.feed.title }} &middot;
                      <ClientAgo :datetime="item.entry.date" />
                    </q-item-label>
                  </q-item-section>
                </template>

                <q-card>
                  <q-card-section>
                    <div class="q-my-sm text-h5">
                      <q-checkbox
                        v-model="entryStar[item.entry.id]"
                        checked-icon="star"
                        true-value="starred"
                        false-value="unstarred"
                        unchecked-icon="star_border"
                        :disable="entryStar[item.entry.id] === 'starring'"
                        @click="toggleStarEntry(item.entry.id)"
                      />
                      {{ item.entry.title }}
                      <q-btn
                        flat
                        round
                        target="_blank"
                        icon="open_in_new"
                        :href="item.entry.link"
                        rel="noopener noreferrer"
                      />
                    </div>
                    <div class="q-my-sm">by {{ item.entry.author }}</div>
                    <div class="q-my-sm">
                      <q-chip
                        outline
                        clickable
                        icon="category"
                        color="secondary"
                        @click="selectedCategoryId = String(item.feed.category.id)"
                      >
                        Category: {{ item.feed.category.name }}
                      </q-chip>
                      <q-chip
                        outline
                        clickable
                        color="primary"
                        icon="rss_feed"
                        @click="selectedFeedId = String(item.feed.id)"
                      >
                        Feed: {{ item.feed.title }}
                      </q-chip>
                      <q-chip outline color="accent" icon="calendar_today">
                        Date: <ClientDateTime :datetime="item.entry.date" />
                      </q-chip>
                    </div>
                  </q-card-section>
                  <q-card-section>
                    <MarkedText
                      v-if="getContent(item.entry.id)"
                      is-html
                      :keyword="searchQuery"
                      class="col entry-content"
                      :text="getContent(item.entry.id)"
                    />
                  </q-card-section>
                  <q-card-actions>
                    <q-btn
                      flat
                      icon="check"
                      color="primary"
                      label="Mark as read"
                      @click="markAsReadAndCollapse(item.entry.id, index)"
                    />
                    <q-btn flat color="primary" label="Collapse" icon="unfold_less" @click="collapseItem(index)" />
                    <q-btn
                      v-if="!contents[downloadedKey(item.entry.id)]"
                      flat
                      color="primary"
                      label="Download"
                      icon="file_download"
                      :loading="downloading"
                      @click="downloadContent(item.entry.id)"
                    />
                    <q-btn
                      v-else
                      flat
                      icon="undo"
                      color="primary"
                      label="See original"
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
/** @type {Ref<number>} */
const limit = useRouteQuery("limit", "100", { transform: Number });
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

const { data, refresh } = await useAsyncData("initial", async () =>
  Promise.all([
    $fetch("/api/categories"),
    $fetch("/api/count", { query: countQuery.value }),
    $fetch("/api/images/primary-keys"),
    $fetch("/api/feeds/data"),
  ]),
);
const categories = computed(() => data.value?.[0] || []);
const countData = computed(() => data.value?.[1] || { count: 0 });
useHead(() => ({
  title: selectedFeedId.value
    ? `(${countData.value?.count || 0}) Feed: ${getFilteredFeedTitle()} - rdr`
    : selectedCategoryId.value
      ? `(${countData.value?.count || 0}) Category: ${getFilteredCategoryName()} - rdr`
      : `(${countData.value?.count || 0}) rdr`,
}));
const feedsData = computed(() => data.value?.[3] || null);
const imagePks = computed(() => data.value?.[2] || []);

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
  query.limit = limit.value;
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
      if (newItems.length < limit.value) hasMore.value = false;
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
  offset.value += limit.value;
  await load();
  if (done) done();
}

/**
 * @param {number} feedId
 * @returns {boolean}
 */
function imageExists(feedId) {
  const key = buildFeedImageKey(feedId);
  return imagePks.value?.includes(key) || false;
}

async function markAllAsRead() {
  const body = {};
  if (selectedFeedId.value) {
    body.selectedType = "feed";
    body.selectedId = selectedFeedId.value;
  } else if (selectedCategoryId.value) {
    body.selectedType = "category";
    body.selectedId = selectedCategoryId.value;
  }
  if (searchQuery.value) body.search = searchQuery.value;
  try {
    await $fetch("/api/entries/mark-as-read", { method: "POST", body });
    for (const item of items.value) entryRead.value[item.entry.id] = "read";
    refresh();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to mark all as read: ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
  }
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
    refresh();
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

  refresh();
  await load();

  if (done) done();
}
watch([limit, listStatus, selectedCategoryId, selectedFeedId, searchQuery], () => {
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
    refresh();
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
    refresh();
    entryStar.value[entryId] = value;
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
