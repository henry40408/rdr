<template>
  <q-layout v-if="loggedIn" view="hhh LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />
        <q-toolbar-title>
          <q-avatar>
            <q-icon name="rss_feed" />
          </q-avatar>
          rdr
        </q-toolbar-title>
        <q-input
          v-model="searchQuery"
          dark
          dense
          borderless
          debounce="500"
          placeholder="Search"
          input-class="text-right"
        >
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
        <q-item-label header>Categories</q-item-label>
        <q-item>
          <q-item-section>
            <ClientOnly>
              <q-toggle v-model="hideEmpty" label="Hide empty" />
            </ClientOnly>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-select
              v-model="categoriesOrder"
              filled
              size="xs"
              emit-value
              map-options
              label="Sort by"
              :options="[
                { label: 'Count', value: 'count' },
                { label: 'Name', value: 'name' },
              ]"
            />
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-radio v-model="categoriesDirection" size="xs" val="asc" label="Ascending" />
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-radio v-model="categoriesDirection" size="xs" val="desc" label="Descending" />
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
                      <img
                        loading="lazy"
                        alt="Feed image"
                        decoding="async"
                        :class="{ 'bg-white': isDark }"
                        :src="`/api/images/${buildFeedImageKey(feed.id)}`"
                      />
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
        <q-item-label header>Account</q-item-label>
        <q-item v-if="session?.user">
          <q-item-section>
            <q-item-label overline>USERNAME</q-item-label>
            <q-item-label>{{ session.user.username }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-if="session?.loggedInAt">
          <q-item-section>
            <q-item-label overline>LOGGED IN AT</q-item-label>
            <q-item-label><ClientDateTime :datetime="session.loggedInAt" /></q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-btn label="Log Out" color="negative" @click="logout()" />
          </q-item-section>
        </q-item>
        <q-separator spaced />
        <q-item-label header>Filters</q-item-label>
        <q-item v-ripple tag="label">
          <q-item-section top side>
            <q-radio v-model="itemsStatus" val="unread" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Unread</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-ripple tag="label">
          <q-item-section top side>
            <q-radio v-model="itemsStatus" val="all" />
          </q-item-section>
          <q-item-section>
            <q-item-label>All</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-ripple tag="label">
          <q-item-section top side>
            <q-radio v-model="itemsStatus" val="read" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Read</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-ripple tag="label">
          <q-item-section top side>
            <q-radio v-model="itemsStatus" val="starred" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Starred</q-item-label>
          </q-item-section>
        </q-item>
        <q-separator spaced />
        <q-item-label header>Page size</q-item-label>
        <q-item>
          <q-item-section side>
            {{ itemsLimit }}
          </q-item-section>
          <q-item-section>
            <q-slider v-model.number="itemsLimit" filled markers :min="30" :max="300" :step="30" type="number" />
          </q-item-section>
        </q-item>
        <q-separator spaced />
        <q-item-label header>Sort options</q-item-label>
        <q-item>
          <q-item-section>
            <q-select
              v-model="itemsOrder"
              filled
              emit-value
              map-options
              label="Sort by"
              :options="[{ label: 'Date', value: 'date' }]"
            />
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-radio v-model="itemsDirection" val="desc" label="Descending" />
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-radio v-model="itemsDirection" val="asc" label="Ascending" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <q-page>
        <q-list padding>
          <q-item>
            <q-item-section>
              <q-item-label>
                <span v-if="itemsStatus === 'unread'">Unread</span>
                <span v-else-if="itemsStatus === 'read'">Read</span>
                <span v-else-if="itemsStatus === 'starred'">Starred</span>
                <span v-else>All</span>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge>{{ countData ? countData.count : "..." }}</q-badge>
            </q-item-section>
          </q-item>
          <q-item v-if="filtersEnabled">
            <q-item-section>
              <div>
                <q-chip
                  v-if="selectedCategoryId"
                  removable
                  icon="category"
                  color="secondary"
                  :outline="!isDark"
                  @remove="selectedCategoryId = undefined"
                >
                  Category: {{ getFilteredCategoryName() }}
                </q-chip>
                <q-chip
                  v-if="selectedFeedId"
                  removable
                  color="primary"
                  icon="rss_feed"
                  :outline="!isDark"
                  @remove="selectedFeedId = undefined"
                >
                  Feed: {{ getFilteredFeedTitle() }}
                </q-chip>
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
        <q-banner v-if="!loading && items.length === 0" class="bg-grey-2 text-grey-7">
          <template #avatar>
            <q-icon name="info" />
          </template>
          <div>No entries found.</div>
          <div class="text-caption">
            Try adjusting your filters or <router-link to="/settings">add new feeds</router-link>.
          </div>
        </q-banner>
        <q-pull-to-refresh @refresh="resetThenLoad">
          <q-infinite-scroll ref="infinite-scroll" :offset="250" @load="onLoad">
            <q-list separator>
              <q-expansion-item
                v-for="(item, index) in items"
                ref="item-list"
                :key="item.entry.id"
                v-model="expanded[index]"
                group="entry"
                hide-expand-icon
                header-class="q-pa-none"
                :class="{
                  'bg-grey-9': isDark && isRead(item.entry.id),
                  'bg-grey-1': !isDark && isRead(item.entry.id),
                }"
                @after-show="scrollToContentRef(index)"
                @before-show="loadContent(item.entry.id)"
              >
                <template #header>
                  <q-slide-item
                    class="full-width"
                    right-color="primary"
                    left-color="secondary"
                    :class="{
                      'bg-grey-9': isDark && isRead(item.entry.id),
                      'bg-grey-1': !isDark && isRead(item.entry.id),
                    }"
                    @left="({ reset }) => slideLeft(item.entry.id, index, reset)"
                    @right="({ reset }) => slideRight(item.entry.id, index, reset)"
                  >
                    <template #left>
                      <q-icon size="xs" name="star" />
                      {{ entryStar[item.entry.id] === "starred" ? "Unstar" : "Star" }}
                    </template>
                    <template #right>
                      <q-icon size="xs" name="check" />
                      {{ entryRead[item.entry.id] === "read" ? "Unread" : "Read" }}
                    </template>

                    <q-item>
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
                          <img
                            v-if="imageExists(item.feed.id)"
                            loading="lazy"
                            class="q-mr-sm"
                            alt="Feed image"
                            decoding="async"
                            :class="{ 'bg-white': isDark }"
                            style="height: 0.75rem; width: 0.75rem"
                            :src="`/api/images/${buildFeedImageKey(item.feed.id)}`"
                          />
                          {{ item.category.name }} &middot; {{ item.feed.title }} &middot;
                          <ClientAgo :datetime="item.entry.date" />
                        </q-item-label>
                      </q-item-section>
                      <q-item-section v-if="features?.summarization" top side>
                        <q-icon v-if="summarizations[item.entry.id]" size="xs" color="positive" name="psychology" />
                        <q-spinner v-if="summarizing[item.entry.id]" />
                      </q-item-section>
                    </q-item>
                  </q-slide-item>
                </template>

                <q-card>
                  <q-card-section>
                    <div class="q-my-sm text-h6">
                      <a target="_blank" :href="item.entry.link" rel="noopener noreferrer">
                        <MarkedText :keyword="searchQuery" :text="item.entry.title" />
                      </a>
                      <q-checkbox
                        v-model="entryStar[item.entry.id]"
                        checked-icon="star"
                        true-value="starred"
                        false-value="unstarred"
                        unchecked-icon="star_border"
                        :disable="entryStar[item.entry.id] === 'starring'"
                        @click="toggleStarEntry(item.entry.id)"
                      />
                    </div>
                    <div v-if="item.entry.author" class="q-my-sm">by {{ item.entry.author }}</div>
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
                  <q-card-section v-if="features?.summarization">
                    <q-btn
                      v-if="!summarizations[item.entry.id]"
                      color="primary"
                      icon="psychology"
                      label="Summarize"
                      :loading="summarizing[item.entry.id]"
                      @click="summarizeEntry(item.entry.id)"
                    />
                    <UseClipboard v-else v-slot="{ copy, copied }" :source="summarizations[item.entry.id]">
                      <div
                        class="entry-summary q-pa-md q-mb-sm"
                        :class="{ 'bg-grey-2': !isDark, 'bg-grey-8 text-white': isDark }"
                      >
                        <pre>{{ summarizations[item.entry.id] }}</pre>
                      </div>
                      <q-btn color="secondary" :label="copied ? 'Copied!' : 'Copy'" @click="copy()" />
                    </UseClipboard>
                  </q-card-section>
                  <q-card-section>
                    <MarkedText
                      v-if="getContent(item.entry.id)"
                      :keyword="searchQuery"
                      class="col entry-content"
                      style="max-width: 1000vw"
                      :text="getContent(item.entry.id)"
                    />
                  </q-card-section>
                  <q-card-section>
                    <q-btn
                      v-if="!fullContents[item.entry.id]"
                      color="secondary"
                      icon="file_download"
                      label="Full Content"
                      :loading="scrapping[item.entry.id]"
                      @click="getFullContent(item.entry.id)"
                    />
                    <q-btn
                      v-else
                      icon="undo"
                      color="secondary"
                      label="See original"
                      @click="delete fullContents[item.entry.id]"
                    />
                  </q-card-section>
                </q-card>
              </q-expansion-item>
              <q-item v-if="!hasMore && items.length > 0">
                <q-item-section>
                  <q-item-label header class="text-center">End of list</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-infinite-scroll>
        </q-pull-to-refresh>

        <q-page-sticky v-if="anyExpanded" :offset="[0, 18]" position="bottom">
          <div class="q-gutter-md">
            <q-btn
              fab
              padding="sm"
              color="secondary"
              :icon="isOpenEntryStarred() ? 'star' : 'star_border'"
              @click="toggleStarOpenEntry()"
            />
            <q-btn fab icon="close" padding="sm" color="primary" @click="collapseOpenItem()" />
            <q-btn fab icon="done" padding="sm" color="secondary" @click="markOpenAsReadAndCollapse()" />
          </div>
        </q-page-sticky>

        <q-page-sticky :offset="[18, 18]" position="bottom-right">
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
              label="Reset filters"
              label-position="left"
              icon="filter_list_off"
              @click="
                selectedCategoryId = undefined;
                selectedFeedId = undefined;
                searchQuery = '';
              "
            />
            <q-fab-action
              external-label
              icon="done_all"
              color="secondary"
              label="Mark as read"
              label-position="left"
              @click="markManyAsReadDialog()"
            />
          </q-fab>
        </q-page-sticky>
      </q-page>
    </q-page-container>
  </q-layout>
  <LoginPage v-else />
</template>

<script setup>
import { UseClipboard } from "@vueuse/components";
import { add } from "date-fns";
import pangu from "pangu";
import { useQuasar } from "quasar";
import { useRouteQuery } from "@vueuse/router";

const { hideEmpty } = useLocalSettings();
const { loggedIn, session, clear: logout } = useUserSession();
const features = useFeatures();

const $q = useQuasar();
const isDark = useDark();
onMounted(() => {
  $q.dark.set(isDark.value);
});
watchEffect(
  () => {
    if (isDark.value !== $q.dark.isActive) $q.dark.set(isDark.value);
  },
  { flush: "post" },
);

const infiniteScroll = useTemplateRef("infinite-scroll");
const itemRefs = useTemplateRef("item-list");

/** @type {Ref<{ [key: string]: string }> } */
const contents = ref({});
/** @type {Ref<{ [key: string]: string }> } */
const fullContents = ref({});
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
/** @type {Ref<Record<string,boolean>>} */
const scrapping = ref({});
/** @type {Ref<{ [key: string]: string }>} */
const summarizations = ref({});
/** @type {Ref<Record<string,boolean>>} */
const summarizing = ref({});

/** @type {Ref<"asc"|"desc">} */
const categoriesDirection = useRouteQuery("categoriesDirection", "asc");
/** @type {Ref<"name"|"count">} */
const categoriesOrder = useRouteQuery("categoriesOrder", "name");
/** @type {Ref<"asc"|"desc">} */
const itemsDirection = useRouteQuery("direction", "desc");
/** @type {Ref<number>} */
const itemsLimit = useRouteQuery("limit", "30", { transform: Number });
/** @type {Ref<"date">} */
const itemsOrder = useRouteQuery("order", "date");
/** @type {Ref<"all"|"read"|"unread"|"starred">} */
const itemsStatus = useRouteQuery("status", "unread");
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
  if (itemsStatus.value) query.status = itemsStatus.value;
  return query;
});
const filtersEnabled = computed(() => !!selectedFeedId.value || !!selectedCategoryId.value || !!searchQuery.value);

const { data, refresh } = await useAsyncData("initial", async () =>
  Promise.all([
    useRequestFetch()("/api/categories"),
    useRequestFetch()("/api/count", { query: countQuery.value }),
    useRequestFetch()("/api/images/primary-keys"),
    useRequestFetch()("/api/feeds/data"),
  ]),
);
const categories = computed(() => {
  const original = data.value?.[0] ?? [];

  for (const category of original) {
    category.feeds.sort((a, b) => {
      const [aTitle, bTitle] = [a.title.toLowerCase(), b.title.toLowerCase()];
      return aTitle < bTitle ? -1 : aTitle > bTitle ? 1 : 0;
    });
  }

  switch (categoriesOrder.value) {
    case "count":
      return original.slice().sort((a, b) => {
        const aCount = a.feeds.reduce((acc, f) => {
          const unreadCount = feedsData.value?.feeds[f.id]?.unreadCount ?? 0;
          return acc + unreadCount;
        }, 0);
        const bCount = b.feeds.reduce((acc, f) => {
          const unreadCount = feedsData.value?.feeds[f.id]?.unreadCount ?? 0;
          return acc + unreadCount;
        }, 0);
        return categoriesDirection.value === "asc" ? aCount - bCount : bCount - aCount;
      });
    case "name":
    default:
      return original.slice().sort((a, b) => {
        const order = categoriesDirection.value === "asc" ? 1 : -1;
        const [aName, bName] = [a.name.toLowerCase(), b.name.toLowerCase()];
        return aName < bName ? -order : aName > bName ? order : 0;
      });
  }
});
const countData = computed(() => data.value?.[1] ?? { count: 0 });
useHead(() => ({
  title: selectedFeedId.value
    ? `(${countData.value?.count ?? 0}) Feed: ${getFilteredFeedTitle()} - rdr`
    : selectedCategoryId.value
      ? `(${countData.value?.count ?? 0}) Category: ${getFilteredCategoryName()} - rdr`
      : `(${countData.value?.count ?? 0}) rdr`,
}));
const feedsData = computed(() => data.value?.[3]);
const imagePks = computed(() => data.value?.[2] ?? []);

/**
 * @param {number} categoryId
 * @returns {number}
 */
function categoryUnreadCount(categoryId) {
  if (!feedsData.value) return 0;
  const feedIds = categories.value?.filter((c) => c.id === categoryId).flatMap((c) => c.feeds.map((f) => f.id)) ?? [];
  return feedIds.reduce((sum, feedId) => sum + (feedsData.value?.feeds[feedId]?.unreadCount ?? 0), 0);
}

function collapseOpenItem() {
  const index = expanded.value.findIndex((v) => v);
  if (index === -1) return;
  expanded.value[index] = false;
  scrollToContentRef(index);
}

/**
 * @param {"day"|"week"|"month"|"year"} [olderThan]
 */
async function doMarkManyAsRead(olderThan) {
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
    const { updated } = await useRequestFetch()("/api/entries/mark-as-read", { method: "POST", body });
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
}

/**
 * @param {number} feedId
 * @returns {number}
 */
function feedUnreadCount(feedId) {
  if (!feedsData.value) return 0;
  return feedsData.value?.feeds[feedId]?.unreadCount ?? 0;
}

/**
 * @param {number} entryId
 * @returns {string}
 */
function getContent(entryId) {
  return fullContents.value[entryId] ?? contents.value[entryId] ?? "";
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

/**
 * @param {number} entryId
 */
async function getFullContent(entryId) {
  try {
    if (fullContents.value[entryId]) return;
    scrapping.value[entryId] = true;
    const parsed = await useRequestFetch()(`/api/entries/${entryId}/full-content`);
    if (parsed && parsed.content) fullContents.value[entryId] = parsed.content;
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to download full content: ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
  } finally {
    scrapping.value[entryId] = false;
  }
}

async function load() {
  const query = {};
  if (itemsDirection.value) query.direction = itemsDirection.value;
  if (itemsOrder.value) query.order = itemsOrder.value;
  if (itemsStatus.value) query.status = itemsStatus.value;
  if (selectedFeedId.value) {
    query.selectedType = "feed";
    query.selectedId = selectedFeedId.value;
  } else if (selectedCategoryId.value) {
    query.selectedType = "category";
    query.selectedId = selectedCategoryId.value;
  }
  if (searchQuery.value) query.search = searchQuery.value;
  query.limit = itemsLimit.value;
  query.offset = offset.value;

  loading.value = true;
  try {
    const newItems = await useRequestFetch()("/api/entries", { query });
    for (const item of newItems) {
      items.value.push(item);
      entryRead.value[item.entry.id] = item.entry.readAt ? "read" : "unread";
      entryStar.value[item.entry.id] = item.entry.starredAt ? "starred" : "unstarred";
    }
    if (newItems.length < itemsLimit.value) hasMore.value = false;

    if (itemsStatus.value === "unread" && items.value.length === 0) {
      if (selectedFeedId.value) {
        $q.notify({
          type: "info",
          icon: "search_off",
          message: `No entries found for the selected ${getFilteredFeedTitle()}.`,
          progress: true,
          actions: [{ icon: "close", color: "white" }],
        });
        selectedFeedId.value = undefined;
        await nextTick();
        return;
      }
      if (selectedCategoryId.value) {
        $q.notify({
          type: "info",
          icon: "search_off",
          message: `No entries found for the selected ${getFilteredCategoryName()}.`,
          progress: true,
          actions: [{ icon: "close", color: "white" }],
        });
        selectedCategoryId.value = undefined;
        await nextTick();
        return;
      }
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

/**
 * @param {number} entryId
 */
async function loadContent(entryId) {
  try {
    if (contents.value[entryId]) return;
    const { content } = await useRequestFetch()(`/api/entries/${entryId}/content`);
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
 * @param {number} feedId
 * @returns {boolean}
 */
function imageExists(feedId) {
  const key = buildFeedImageKey(feedId);
  return imagePks.value?.includes(key) ?? false;
}

function isOpenEntryStarred() {
  const index = expanded.value.findIndex((v) => v);
  if (index === -1) return false;

  const item = items.value[index];
  if (item) return entryStar.value[item.entry.id] === "starred";
  return false;
}

/**
 * @param {number} entryId
 * @returns {boolean}
 */
function isRead(entryId) {
  return entryRead.value[entryId] === "read";
}

function markManyAsReadDialog() {
  $q.dialog({
    title: "Mark all as read",
    message: "Are you sure you want to mark all entries as read?",
    options: {
      type: "radio",
      model: "all",
      items: [
        { label: filtersEnabled.value ? "Filtered entries" : "All entries", value: "all" },
        { label: "Older than 1 day", value: "day" },
        { label: "Older than 1 week", value: "week" },
        { label: "Older than 1 month", value: "month" },
        { label: "Older than 1 year", value: "year" },
      ],
    },
    ok: { color: "negative" },
    cancel: true,
    persistent: true,
  }).onOk(
    /** @param {"day"|"week"|"month"|"year"|"all"} data */
    async (data) => {
      if (data === "all") await doMarkManyAsRead();
      else await doMarkManyAsRead(data);
    },
  );
}

/**
 * @param {number} entryId
 */
async function markAsRead(entryId) {
  if (entryRead.value[entryId] === "read") return;
  const value = entryRead.value[entryId];
  try {
    entryRead.value[entryId] = "toggling";
    await useRequestFetch()(`/api/entries/${entryId}/read`, { method: "PUT" });
    entryRead.value[entryId] = "read";
    refresh();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to mark entry ${entryId} as read: ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
    if (value) entryRead.value[entryId] = value;
  }
}

/**
 * @param {number} entryId
 * @param {number} index
 */
async function markAsReadAndCollapse(entryId, index) {
  await markAsRead(entryId);
  expanded.value[index] = false;
  scrollToContentRef(index);
}

function markOpenAsReadAndCollapse() {
  const index = expanded.value.findIndex((v) => v);
  if (index === -1) return;

  const entryId = items.value[index]?.entry.id;
  if (entryId) markAsReadAndCollapse(entryId, index);
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
  offset.value += itemsLimit.value;
  await load();
  if (done) done();
}

/**
 * @param {(stop?:boolean) => void} [done]
 */
async function resetThenLoad(done) {
  contents.value = {};
  fullContents.value = {};
  expanded.value = [];
  hasMore.value = true;
  items.value = [];
  offset.value = 0;

  refresh();
  await load();

  // @ts-expect-error: resume exists
  infiniteScroll.value?.resume();

  if (done) done();
}
watch(
  [loggedIn, itemsDirection, itemsLimit, itemsOrder, itemsStatus, selectedCategoryId, selectedFeedId, searchQuery],
  () => {
    if (loggedIn.value) resetThenLoad();
  },
);

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
 * @param {number} entryId
 * @param {number} index
 * @param {()=>void} done
 */
async function slideLeft(entryId, index, done) {
  entryStar.value[entryId] = entryStar.value[entryId] === "starred" ? "unstarred" : "starred";
  await toggleStarEntry(entryId);
  done();
}

/**
 * @param {number} entryId
 * @param {number} index
 * @param {()=>void} done
 */
async function slideRight(entryId, index, done) {
  entryRead.value[entryId] = entryRead.value[entryId] === "read" ? "unread" : "read";
  await toggleReadEntry(entryId, index);
  done();
}

/**
 * @param {number} entryId
 */
async function summarizeEntry(entryId) {
  const entry = items.value.find((i) => i.entry.id === entryId);
  if (!entry) return;

  summarizing.value[entryId] = true;
  try {
    const text = await useRequestFetch()(`/api/entries/${entryId}/summarize`);

    const [prefixedTitle, content] = text.split("\n\n");
    const title = (prefixedTitle ?? "").replace("Title: ", "").trim();

    summarizations.value[entryId] = `${pangu.spacingText(title)}
    
${entry.entry.link}

${pangu.spacingText(content ?? "")}`;
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to summarize entry ${entryId}: ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
  } finally {
    summarizing.value[entryId] = false;
  }
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
    await useRequestFetch()(`/api/entries/${entryId}/read`, { method: "PUT" });
    refresh();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to toggle entry ${entryId}: ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
  } finally {
    if (value) entryRead.value[entryId] = value;
    if (value === "read") expanded.value[index] = false;
  }
}

/**
 * @param {number} entryId
 */
async function toggleStarEntry(entryId) {
  if (entryStar.value[entryId] === "starring") return;

  // status of checkbox is already changed by the time this function is called
  const value = entryStar.value[entryId];

  entryStar.value[entryId] = "starring";
  try {
    await useRequestFetch()(`/api/entries/${entryId}/star`, { method: "PUT" });
    refresh();
    if (value) entryStar.value[entryId] = value;
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to toggle star for entry ${entryId}: ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
  }
}

async function toggleStarOpenEntry() {
  const index = expanded.value.findIndex((v) => v);
  if (index === -1) return;

  const entryId = items.value[index]?.entry.id;
  if (entryId) {
    // manually toggle the value first because the checkbox is not used here
    entryStar.value[entryId] = entryStar.value[entryId] === "starred" ? "unstarred" : "starred";
    await toggleStarEntry(entryId);
  }
}
</script>

<style>
.body--dark a {
  color: white;
}

.body--dark .entry-content a {
  color: white;
}

.entry-summary {
  width: 100%;
  overflow: hidden;
}

.entry-summary pre {
  margin: 0;
  overflow-wrap: break-word;
  text-wrap: break-word;
  white-space: pre-wrap;
}

.entry-content img {
  max-width: 100%;
  height: auto;
}

.entry-content mark {
  background-color: yellow;
  color: black;
}

.entry-content pre {
  overflow-x: auto;
}
</style>
