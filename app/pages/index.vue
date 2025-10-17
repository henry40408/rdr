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
              <q-item
                v-ripple
                clickable
                @click="
                  selectedCategoryId = String(category.id);
                  selectedFeedId = undefined;
                "
              >
                <q-item-section>
                  <q-item-label>{{ category.name }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge color="primary" :outline="!categoryUnreadCount(category.id)">
                    {{ categoryUnreadCount(category.id) }}
                  </q-badge>
                </q-item-section>
              </q-item>
              <q-separator />
              <template v-for="feed in category.feeds" :key="feed.id">
                <q-item
                  v-if="!hideEmpty || feedUnreadCount(feed.id) > 0"
                  v-ripple
                  clickable
                  @click="
                    selectedCategoryId = String(category.id);
                    selectedFeedId = String(feed.id);
                  "
                >
                  <q-item-section avatar>
                    <q-avatar v-if="imageExists(feed.id)" square>
                      <q-img :class="{ 'bg-white': isDark }" :src="`/api/images/${buildFeedImageKey(feed.id)}`" />
                    </q-avatar>
                    <q-icon v-else name="rss_feed" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label lines="1">{{ feed.title }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge color="primary" :outline="!feedUnreadCount(feed.id)">
                      {{ feedUnreadCount(feed.id) }}
                    </q-badge>
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
      <q-list padding>
        <q-item>
          <q-item-section header>
            <q-item-label class="text-h6">Filters</q-item-label>
            <q-item-label caption>Adjust your feed display options</q-item-label>
          </q-item-section>
        </q-item>
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
        <q-separator spaced />
        <q-item-label header>Page size</q-item-label>
        <q-item>
          <q-item-section side>
            {{ listLimit }}
          </q-item-section>
          <q-item-section>
            <q-slider v-model.number="listLimit" filled markers :min="100" :max="1000" :step="100" type="number" />
          </q-item-section>
        </q-item>
        <q-separator spaced />
        <q-item-label header>Sort options</q-item-label>
        <q-item>
          <q-item-section>
            <q-select
              v-model="listOrder"
              filled
              outlined
              map-options
              label="Sort by"
              :options="[{ label: 'Date', value: 'date' }]"
            />
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-radio v-model="listDirection" val="desc" label="Descending" />
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-radio v-model="listDirection" val="asc" label="Ascending" />
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
                  <div class="text-h6">
                    <span v-if="listStatus === 'unread'">Unread</span>
                    <span v-else-if="listStatus === 'read'">Read</span>
                    <span v-else-if="listStatus === 'starred'">Starred</span>
                    <span v-else>All</span>
                  </div>
                  <q-badge>{{ countData ? countData.count : "..." }}</q-badge>
                </div>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn-group flat class="gt-xs">
                <q-btn icon="refresh" label="Refresh" @click="resetThenLoad()" />
                <q-btn-dropdown split auto-close icon="done_all" label="Mark all as read" @click="markAllAsRead()">
                  <q-list>
                    <q-item clickable @click="markAllAsRead('day')">
                      <q-item-section>
                        <q-item-label>Older than 1 day</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item clickable @click="markAllAsRead('week')">
                      <q-item-section>
                        <q-item-label>Older than 1 week</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item clickable @click="markAllAsRead('month')">
                      <q-item-section>
                        <q-item-label>Older than 1 month</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item clickable @click="markAllAsRead('year')">
                      <q-item-section>
                        <q-item-label>Older than 1 year</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </q-btn-group>
            </q-item-section>
          </q-item>
          <q-item v-if="!!selectedCategoryId || !!selectedFeedId || !!searchQuery">
            <q-item-section>
              <div>
                <q-chip
                  v-if="selectedCategoryId"
                  removable
                  icon="category"
                  color="secondary"
                  :outline="!isDark"
                  @remove="selectedCategoryId = undefined"
                  >Category: {{ getFilteredCategoryName() }}</q-chip
                >
                <q-chip
                  v-if="selectedFeedId"
                  removable
                  color="primary"
                  icon="rss_feed"
                  :outline="!isDark"
                  @remove="selectedFeedId = undefined"
                  >Feed: {{ getFilteredFeedTitle() }}</q-chip
                >
                <q-chip
                  v-if="searchQuery"
                  removable
                  icon="search"
                  color="accent"
                  :outline="!isDark"
                  @remove="searchQuery = ''"
                >
                  Search: {{ searchQuery }}
                </q-chip>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
        <q-card v-if="loading" flat>
          <q-card-section class="row justify-center">
            <q-spinner color="primary" />
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
              <q-slide-item
                v-for="(item, index) in items"
                :key="item.entry.id"
                right-color="primary"
                left-color="secondary"
                :class="{ 'bg-grey-3': entryRead[item.entry.id] === 'read' }"
                @left="({ reset }) => slideLeft(reset, item.entry.id)"
                @right="({ reset }) => slideRight(reset, item.entry.id, index)"
              >
                <template #left>
                  <q-icon name="star" class="q-mr-sm" />
                  {{ entryStar[item.entry.id] === "starred" ? "Unstar" : "Star" }}
                </template>
                <template #right>
                  <q-icon name="done" class="q-mr-sm" />
                  Mark as {{ entryRead[item.entry.id] === "read" ? "unread" : "read" }}
                </template>

                <q-expansion-item
                  ref="item-list"
                  v-model="expanded[index]"
                  clickable
                  group="entry"
                  @after-hide="scrollToContentRef(index)"
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
                          :class="{ 'bg-white': isDark }"
                          :src="`/api/images/${buildFeedImageKey(item.feed.id)}`"
                        />
                        {{ item.category.name }} &middot; {{ item.feed.title }} &middot;
                        <ClientAgo :datetime="item.entry.date" />
                      </q-item-label>
                    </q-item-section>
                  </template>

                  <q-card>
                    <q-card-section>
                      <div class="q-my-sm text-h6">
                        <q-checkbox
                          v-model="entryStar[item.entry.id]"
                          checked-icon="star"
                          true-value="starred"
                          false-value="unstarred"
                          unchecked-icon="star_border"
                          :disable="entryStar[item.entry.id] === 'starring'"
                          @click="toggleStarEntry(item.entry.id)"
                        />
                        <a
                          target="_blank"
                          :href="item.entry.link"
                          rel="noopener noreferrer"
                          :class="{ 'text-white': isDark, 'text-black': !isDark }"
                        >
                          <MarkedText :keyword="searchQuery" :text="item.entry.title" />
                        </a>
                      </div>
                      <div class="q-my-sm">by {{ item.entry.author }}</div>
                      <div class="q-my-sm">
                        <q-chip
                          clickable
                          icon="category"
                          color="secondary"
                          :outline="!isDark"
                          @click="selectedCategoryId = String(item.category.id)"
                        >
                          Category: {{ item.category.name }}
                        </q-chip>
                        <q-chip
                          clickable
                          color="primary"
                          icon="rss_feed"
                          :outline="!isDark"
                          @click="selectedFeedId = String(item.feed.id)"
                        >
                          Feed: {{ item.feed.title }}
                        </q-chip>
                        <q-chip color="accent" :outline="!isDark" icon="calendar_today">
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
                      <q-btn
                        flat
                        color="primary"
                        label="Collapse"
                        icon="unfold_less"
                        @click="expanded[index] = false"
                      />
                      <q-btn
                        v-if="!downloadedContents[item.entry.id]"
                        flat
                        color="primary"
                        label="Download"
                        icon="file_download"
                        :loading="downloading[item.entry.id]"
                        @click="downloadContent(item.entry.id)"
                      />
                      <q-btn
                        v-else
                        flat
                        icon="undo"
                        color="primary"
                        label="See original"
                        @click="downloadedContents[item.entry.id] = ''"
                      />
                    </q-card-actions>
                  </q-card>
                </q-expansion-item>
              </q-slide-item>
              <q-item v-if="!hasMore && items.length > 0">
                <q-item-section>
                  <q-item-label class="text-center text-grey-8">End of list</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-infinite-scroll>
        </q-pull-to-refresh>

        <q-page-sticky v-if="anyExpanded" :offset="[18, 18]" position="top-right">
          <q-fab icon="close" padding="sm" color="secondary" @click="expanded = []" />
        </q-page-sticky>

        <q-page-sticky class="lt-sm" :offset="[18, 18]" position="bottom-right">
          <q-fab direction="up" color="primary" icon="keyboard_arrow_up">
            <q-fab-action
              external-label
              icon="refresh"
              label="Refresh"
              color="secondary"
              label-position="left"
              @click="resetThenLoad()"
            />
            <q-fab-action
              external-label
              color="secondary"
              icon="filter_list"
              label="Reset filters"
              label-position="left"
              @click="
                selectedCategoryId = undefined;
                selectedFeedId = undefined;
                searchQuery = '';
              "
            />
            <q-fab-action
              color="accent"
              external-label
              icon="done_all"
              label-position="left"
              label="Mark older than a day as read"
              @click="markAllAsRead('day')"
            />
            <q-fab-action
              color="accent"
              external-label
              icon="done_all"
              label-position="left"
              label="Mark older than a week as read"
              @click="markAllAsRead('week')"
            />
            <q-fab-action
              color="accent"
              external-label
              icon="done_all"
              label-position="left"
              label="Mark older than a month as read"
              @click="markAllAsRead('month')"
            />
            <q-fab-action
              color="accent"
              external-label
              icon="done_all"
              label-position="left"
              label="Mark older than a year as read"
              @click="markAllAsRead('year')"
            />
            <q-fab-action
              color="accent"
              external-label
              icon="done_all"
              label-position="left"
              label="Mark all as read"
              @click="markAllAsRead()"
            />
          </q-fab>
        </q-page-sticky>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useRouteQuery } from "@vueuse/router";
import { add } from "date-fns";
import { useQuasar } from "quasar";

const $q = useQuasar();
const isDark = useDark();
onMounted(() => {
  $q.dark.set(isDark.value);
});

const itemRefs = useTemplateRef("item-list");
const { hideEmpty } = useLocalSettings();

/** @type {Ref<{ [key: string]: string }> } */
const contents = ref({});
/** @type {Ref<{ [key: string]: string }> } */
const downloadedContents = ref({});
/** @type {Ref<Record<string,boolean>>} */
const downloading = ref({});
/** @type {Ref<Record<string,"read"|"toggling"|"unread">>} */
const entryRead = ref({});
/** @type {Ref<Record<string,"unstarred"|"starring"|"starred">>} */
const entryStar = ref({});
/** @type {Ref<boolean[]>} */
const expanded = ref([]);
const hasMore = ref(true);
/** @type {Ref<import('../../server/api/entries.get').EntryEntityWithFeed[]>} */
const items = ref([]);
const leftDrawerOpen = ref(false);
const loading = ref(false);
const offset = ref(0);
const rightDrawerOpen = ref(false);

/** @type {Ref<"asc"|"desc">} */
const listDirection = useRouteQuery("direction", "desc");
/** @type {Ref<number>} */
const listLimit = useRouteQuery("limit", "100", { transform: Number });
/** @type {Ref<"date">} */
const listOrder = useRouteQuery("order", "date");
/** @type {Ref<"all"|"read"|"unread"|"starred">} */
const listStatus = useRouteQuery("status", "unread");
/** @type {Ref<string|undefined>} */
const selectedCategoryId = useRouteQuery("categoryId", undefined);
/** @type {Ref<string|undefined>} */
const selectedFeedId = useRouteQuery("feedId", undefined);
/** @type {Ref<string>} */
const searchQuery = useRouteQuery("q", null);

const anyExpanded = computed(() => expanded.value.some((v) => v));
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
 */
async function downloadContent(entryId) {
  try {
    if (downloadedContents.value[entryId]) return;
    downloading.value[entryId] = true;
    const parsed = await $fetch(`/api/entries/${entryId}/download`);
    if (parsed && parsed.content) downloadedContents.value[entryId] = parsed.content;
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to download entry content: ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
  } finally {
    downloading.value[entryId] = false;
  }
}

/**
 * @param {number} entryId
 * @returns {string}
 */
function getContent(entryId) {
  return downloadedContents.value[entryId] || contents.value[entryId] || "";
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
  if (listDirection.value) query.direction = listDirection.value;
  if (listOrder.value) query.order = listOrder.value;
  if (listStatus.value) query.status = listStatus.value;
  if (selectedFeedId.value) {
    query.selectedType = "feed";
    query.selectedId = selectedFeedId.value;
  } else if (selectedCategoryId.value) {
    query.selectedType = "category";
    query.selectedId = selectedCategoryId.value;
  }
  if (searchQuery.value) query.search = searchQuery.value;
  query.limit = listLimit.value;
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
      if (newItems.length < listLimit.value) hasMore.value = false;
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
  try {
    if (contents.value[entryId]) return;
    const { content } = await $fetch(`/api/entries/${entryId}/content`);
    contents.value[entryId] = content;
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
  offset.value += listLimit.value;
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

/**
 * @param {"day"|"week"|"month"|"year"} [olderThan]
 */
async function markAllAsRead(olderThan) {
  $q.dialog({
    title: "Mark all as read",
    message: olderThan
      ? `Are you sure you want to mark all entries older than ${olderThan} as read?`
      : "Are you sure you want to mark all entries as read?",
    ok: { color: "negative" },
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    const now = new Date();

    const body = {};
    if (olderThan) body.olderThan = olderThan;
    if (selectedFeedId.value) {
      body.selectedType = "feed";
      body.selectedId = selectedFeedId.value;
    } else if (selectedCategoryId.value) {
      body.selectedType = "category";
      body.selectedId = selectedCategoryId.value;
    }
    if (searchQuery.value) body.search = searchQuery.value;
    try {
      const { updated } = await $fetch("/api/entries/mark-as-read", { method: "POST", body });
      for (const item of items.value)
        if (shouldMarkAsRead(now, item.entry.id, olderThan)) entryRead.value[item.entry.id] = "read";
      refresh();
      $q.notify({
        type: "positive",
        message: `Marked ${updated} entries as read.`,
        actions: [{ icon: "close", color: "white" }],
      });
    } catch (err) {
      $q.notify({
        type: "negative",
        message: `Failed to mark all as read: ${err}`,
        actions: [{ icon: "close", color: "white" }],
      });
    }
  });
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
  expanded.value[index] = false;
}

/**
 * @param {(stop?:boolean) => void} [done]
 */
async function resetThenLoad(done) {
  contents.value = {};
  downloadedContents.value = {};
  expanded.value = [];
  hasMore.value = true;
  items.value = [];
  offset.value = 0;

  refresh();
  await load();

  if (done) done();
}
watch([listDirection, listLimit, listOrder, listStatus, selectedCategoryId, selectedFeedId, searchQuery], () => {
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
 * @param {Date} now
 * @param {number} entryId
 * @param {"day"|"week"|"month"|"year"} [olderThan]
 */
function shouldMarkAsRead(now, entryId, olderThan) {
  if (entryRead.value[entryId] === "read") return true;
  if (!olderThan) return true; // mark all as read

  const item = items.value.find((i) => i.entry.id === entryId);
  if (!item) return false;

  const entryDate = new Date(item.entry.date);
  switch (olderThan) {
    case "day":
      return entryDate <= add(now, { days: -1 });
    case "week":
      return entryDate <= add(now, { days: -7 });
    case "month":
      return entryDate <= add(now, { months: -1 });
    case "year":
      return entryDate <= add(now, { years: -1 });
    default:
      return false;
  }
}

/**
 * @param {() => void} reset
 * @param {number} entryId
 */
function slideLeft(reset, entryId) {
  // toggleStarEntry doesn't change state for checkbox,
  // so we set it to "starred" here
  entryStar.value[entryId] = entryStar.value[entryId] === "unstarred" ? "starred" : "unstarred";

  toggleStarEntry(entryId);
  reset();
}

/**
 * @param {() => void} reset
 * @param {number} entryId
 * @param {number} index
 */
function slideRight(reset, entryId, index) {
  // toggleReadEntry doesn't change state for checkbox,
  // so we set it to "read" here
  entryRead.value[entryId] = entryRead.value[entryId] === "unread" ? "read" : "unread";

  toggleReadEntry(entryId, index);
  reset();
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
    if (value === "read") expanded.value[index] = false;
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
