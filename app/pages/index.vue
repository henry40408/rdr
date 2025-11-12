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
          filled
          debounce="500"
          input-class="text-right"
          placeholder="Search entries"
        >
          <template #append>
            <q-icon v-if="!searchQuery" name="search" />
            <q-icon v-else name="clear" class="cursor-pointer" @click="searchQuery = ''" />
          </template>
        </q-input>
        <NavTabs />
        <q-btn flat dense round icon="menu" @click="rightDrawerOpen = !rightDrawerOpen" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered persistent side="left" show-if-above>
      <q-list padding>
        <q-item>
          <q-item-section>Categories</q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <ClientOnly>
              <q-select
                v-model="categoriesOrder"
                filled
                emit-value
                map-options
                label="Sort by"
                :options="[
                  { label: 'Unread count', value: 'unread_count' },
                  { label: 'Name', value: 'category_name' },
                ]"
              />
            </ClientOnly>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <ClientOnly>
              <q-radio v-model="categoriesDirection" val="desc" label="Descending" />
              <q-radio v-model="categoriesDirection" val="asc" label="Ascending" />
            </ClientOnly>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <ClientOnly>
              <q-toggle v-model="hideEmpty" label="Hide empty" />
            </ClientOnly>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-input v-model="categoryFeedQuery" filled clearable label="Filter categories and / or feeds" />
          </q-item-section>
        </q-item>
        <ClientOnly>
          <template v-for="category in sortedCategories" :key="category.id">
            <q-item
              v-show="shouldShowCategory(category.id)"
              v-ripple
              clickable
              @click="
                selectedCategoryId = String(category.id);
                selectedFeedId = undefined;
              "
            >
              <q-item-section>
                <q-item-label>
                  <MarkedText :text="category.name" :keyword="categoryFeedQuery" />
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge color="primary" :outline="getCategoryUnreadCount(category.id) === 0">
                  {{ getCategoryUnreadCount(category.id) }}
                </q-badge>
              </q-item-section>
            </q-item>
            <q-separator v-if="shouldShowCategory(category.id)" />
            <template v-for="feed in category.feeds" :key="feed.id">
              <q-item
                v-show="shouldShowFeed(feed.id)"
                v-ripple
                clickable
                @click="
                  selectedCategoryId = String(category.id);
                  selectedFeedId = String(feed.id);
                "
              >
                <q-item-section avatar>
                  <q-avatar v-if="isImageExists(feed.id)" square>
                    <img
                      loading="lazy"
                      alt="Feed image"
                      decoding="async"
                      :class="{ 'bg-white': isDark }"
                      :src="`/api/images/external/${buildFeedImageKey(feed.id)}`"
                    />
                  </q-avatar>
                  <q-icon v-else name="rss_feed" />
                </q-item-section>
                <q-item-section>
                  <q-item-label lines="1">
                    <MarkedText :text="feed.title" :keyword="categoryFeedQuery" />
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge color="primary" :outline="getFeedUnreadCount(feed.id) === 0">
                    {{ getFeedUnreadCount(feed.id) }}
                  </q-badge>
                </q-item-section>
              </q-item>
            </template>
          </template>
          <q-banner v-if="categories.length <= 0" :class="{ 'bg-grey-9': isDark, 'bg-grey-3': !isDark }">
            <div>No categories found</div>
            <div class="text-caption">
              Try adjusting your filters or
              <router-link to="/settings">add new feeds</router-link>.
            </div>
          </q-banner>
        </ClientOnly>
      </q-list>
    </q-drawer>

    <q-drawer v-model="rightDrawerOpen" bordered persistent side="right" show-if-above>
      <q-list padding>
        <q-item>
          <q-item-section>Version</q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label caption>Version</q-item-label>
            <q-item-label>{{ $config.public.version }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label caption>Build date</q-item-label>
            <q-item-label>
              <ClientDateTime :datetime="$config.public.buildDate" />
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-separator spaced />
        <q-item>
          <q-item-section>Account</q-item-section>
        </q-item>
        <q-item v-if="session?.user">
          <q-item-section>
            <q-item-label caption>Username</q-item-label>
            <q-item-label>{{ session.user.username }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-if="session?.loggedInAt">
          <q-item-section>
            <q-item-label caption>Logged in at</q-item-label>
            <q-item-label><ClientDateTime :datetime="session.loggedInAt" /></q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-btn label="Log Out" color="negative" @click="logout()" />
          </q-item-section>
        </q-item>
        <q-separator spaced />
        <q-item>
          <q-item-section>Filters</q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-radio v-model="itemsStatus" val="unread" label="Unread" />
            <q-radio v-model="itemsStatus" val="all" label="All" />
            <q-radio v-model="itemsStatus" val="read" label="Read" />
            <q-radio v-model="itemsStatus" val="starred" label="Starred" />
          </q-item-section>
        </q-item>
        <q-separator spaced />
        <q-item>
          <q-item-section>Page size</q-item-section>
        </q-item>
        <q-item>
          <q-item-section side>
            {{ itemsLimit }}
          </q-item-section>
          <q-item-section>
            <q-slider v-model.number="itemsLimit" filled markers :min="30" :max="300" :step="30" type="number" />
          </q-item-section>
        </q-item>
        <q-separator spaced />
        <q-item>
          <q-item-section>Sort options</q-item-section>
        </q-item>
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
        <q-pull-to-refresh @refresh="resetThenLoad">
          <q-infinite-scroll ref="infinite-scroll" :offset="250" @load="onLoad">
            <q-list separator>
              <q-item
                v-if="!pending && items.length === 0"
                class="q-pa-md q-mb-md"
                :class="{ 'bg-grey-9': isDark, 'bg-grey-3': !isDark }"
              >
                <q-item-section side>
                  <q-icon name="info" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>No entries found.</q-item-label>
                  <q-item-label caption>
                    Try adjusting your filters or <router-link to="/settings">add new feeds</router-link>.
                  </q-item-label>
                </q-item-section>
              </q-item>
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
                      'bg-grey-3': !isDark && isRead(item.entry.id),
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
                        <q-item-label caption
                          >{{ item.feed.title }} &middot; {{ item.category.name }} &middot;
                          <ClientAgo :datetime="item.entry.date" />
                        </q-item-label>
                        <q-item-label lines="3">
                          <q-avatar square size="xs" class="bg-white q-mr-sm">
                            <img
                              v-if="isImageExists(item.feed.id)"
                              loading="lazy"
                              alt="Feed image"
                              decoding="async"
                              :src="`/api/images/external/${buildFeedImageKey(item.feed.id)}`"
                            />
                          </q-avatar>
                          <MarkedText :keyword="searchQuery" :text="item.entry.title" />
                        </q-item-label>
                      </q-item-section>
                      <q-item-section top side>
                        <q-icon v-if="fullContents[item.entry.id]" size="xs" name="article" />
                        <q-spinner v-if="scrapping[item.entry.id]" />
                        <template v-if="summarizationEnabled">
                          <q-icon v-if="summarizations[item.entry.id]" size="xs" name="psychology" />
                          <q-spinner v-if="summarizing[item.entry.id]" />
                        </template>
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
                        @click="
                          selectedCategoryId = String(item.category.id);
                          selectedFeedId = String(item.feed.id);
                        "
                      >
                        Feed: {{ item.feed.title }}
                      </q-chip>
                      <q-chip color="accent" :outline="!isDark" icon="calendar_today">
                        Date: <ClientDateTime :datetime="item.entry.date" />
                      </q-chip>
                    </div>
                  </q-card-section>
                  <q-card-section>
                    <div class="text-center">
                      <q-btn-group :spread="$q.screen.lt.sm" :class="{ column: $q.screen.lt.sm }">
                        <q-btn
                          v-if="!fullContents[item.entry.id]"
                          :padding="$q.screen.lt.sm ? 'md sm' : 'sm'"
                          :icon="scrapping[item.entry.id] ? 'cancel' : 'article'"
                          :label="scrapping[item.entry.id] ? 'Cancel' : 'Full Content'"
                          @click="
                            scrapping[item.entry.id] ? cancelScraping(item.entry.id) : getFullContent(item.entry.id)
                          "
                        />
                        <q-btn
                          v-else
                          icon="undo"
                          label="See original"
                          :padding="$q.screen.lt.sm ? 'md sm' : 'sm'"
                          @click="delete fullContents[item.entry.id]"
                        />
                        <q-btn
                          v-if="saveEnabled"
                          icon="save"
                          label="Save"
                          :loading="saving[item.entry.id]"
                          :padding="$q.screen.lt.sm ? 'md sm' : 'sm'"
                          @click="saveEntry(item.entry.id)"
                        />
                        <template v-if="summarizationEnabled">
                          <q-btn
                            v-if="!summarizations[item.entry.id]"
                            :padding="$q.screen.lt.sm ? 'md sm' : 'sm'"
                            :icon="summarizing[item.entry.id] ? 'cancel' : 'psychology'"
                            :label="summarizing[item.entry.id] ? 'Cancel' : 'Summarize'"
                            @click="
                              summarizing[item.entry.id]
                                ? cancelSummarization(item.entry.id)
                                : summarizeEntry(item.entry.id)
                            "
                          />
                          <q-btn
                            v-else
                            icon="delete"
                            label="Remove summary"
                            :padding="$q.screen.lt.sm ? 'md sm' : 'sm'"
                            @click="delete summarizations[item.entry.id]"
                          />
                        </template>
                      </q-btn-group>
                    </div>
                  </q-card-section>
                  <q-card-section v-if="summarizations[item.entry.id]">
                    <UseClipboard
                      v-if="summarizations[item.entry.id]"
                      v-slot="{ copy, copied }"
                      :source="summarizations[item.entry.id]"
                    >
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
                    <div v-if="!contentLoading[item.entry.id]" class="entry-content">
                      <MarkedText
                        v-if="getContent(item.entry.id)"
                        :keyword="searchQuery"
                        style="max-width: 1000vw"
                        :text="getContent(item.entry.id)"
                      />
                      <q-banner v-else :class="isDark ? 'bg-grey-8 text-white' : 'bg-grey-2'">
                        No content available for this entry.
                      </q-banner>
                    </div>
                    <div v-else class="text-center">
                      <q-spinner size="lg" />
                    </div>
                  </q-card-section>
                </q-card>
              </q-expansion-item>
              <q-item v-if="!hasMore && items.length > 0">
                <q-item-section class="q-pb-md">
                  <q-item-label class="text-center">End of list</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-if="pending" class="text-center">
              <q-spinner size="lg" class="q-my-md" />
            </div>
          </q-infinite-scroll>
        </q-pull-to-refresh>

        <q-page-sticky :offset="[18, 18]" position="bottom-right">
          <div class="column q-gutter-md">
            <template v-if="anyExpanded">
              <q-btn
                fab
                color="secondary"
                :icon="isOpenEntryStarred() ? 'star' : 'star_border'"
                @click="toggleStarOpenEntry()"
              />
              <q-btn fab icon="done" color="secondary" @click="markOpenAsReadAndCollapse()" />
              <q-btn fab icon="close" color="primary" @click="collapseOpenItem()" />
            </template>
            <q-btn v-else fab color="primary" icon="done_all" @click="markManyAsReadDialog()" />
          </div>
        </q-page-sticky>
      </q-page>
    </q-page-container>
  </q-layout>
  <LoginPage v-else />
</template>

<script setup lang="ts">
import { UseClipboard } from "@vueuse/components";
import { add } from "date-fns";
import pangu from "pangu";
import { useQuasar } from "quasar";
import { useRouteQuery } from "@vueuse/router";

const { data: features } = useFeatures();
const { categoriesDirection, categoriesOrder, hideEmpty } = useLocalSettings();
const { loggedIn, session, clear: logout } = useUserSession();

const $q = useQuasar();
$q.loadingBar.setDefaults({
  color: "accent",
  size: "3px",
  position: "bottom",
});

const isDark = useDark();
onMounted(() => {
  $q.dark.set(isDark.value);
});
onUnmounted(() => {
  $q.loadingBar.stop();
});
watchEffect(
  () => {
    if (isDark.value !== $q.dark.isActive) $q.dark.set(isDark.value);
  },
  { flush: "post" },
);

const infiniteScroll = useTemplateRef("infinite-scroll");
const itemRefs = useTemplateRef("item-list");

const categoryFeedQuery = ref("");
const contents: Ref<{ [key: string]: string }> = ref({});
const contentLoading: Ref<{ [key: string]: boolean }> = ref({});
const fullContents: Ref<{ [key: string]: string }> = ref({});
const entryRead: Ref<Record<string, "read" | "toggling" | "unread">> = ref({});
const entryStar: Ref<Record<string, "unstarred" | "starring" | "starred">> = ref({});
const expanded: Ref<boolean[]> = ref([]);
const hasMore = ref(true);
const items: Ref<import("../../server/api/entries.get").EntryEntityWithFeed[]> = ref([]);
const leftDrawerOpen = ref(false);
const offset = ref(0);
const rightDrawerOpen = ref(false);
const saving: Ref<Record<string, boolean>> = ref({});
const scrapping: Ref<Record<string, boolean>> = ref({});
const scrappingControllers: Ref<Record<string, AbortController | undefined>> = ref({});
const summarizations: Ref<{ [key: string]: string }> = ref({});
const summarizing: Ref<Record<string, boolean>> = ref({});
const summarizingControllers: Ref<Record<string, AbortController | undefined>> = ref({});

const itemsDirection: Ref<"asc" | "desc"> = useRouteQuery("direction", "desc");
const itemsLimit: Ref<number> = useRouteQuery("limit", "30", { transform: Number });
const itemsOrder: Ref<"date"> = useRouteQuery("order", "date");
const itemsStatus: Ref<"all" | "read" | "unread" | "starred"> = useRouteQuery("status", "unread");
const selectedCategoryId: Ref<string | undefined> = useRouteQuery("categoryId", undefined);
const selectedFeedId: Ref<string | undefined> = useRouteQuery("feedId", undefined);
const searchQuery: Ref<string> = useRouteQuery("q", null);

const anyExpanded = computed(() => expanded.value.some((v) => v));
const countQuery = computed(() => {
  const query: Record<string, string> = {};
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
const summarizationEnabled = computed(() => !!features.value?.summarization);
const saveEnabled = computed(() => !!features.value?.save);

const headers = useRequestHeaders(["cookie"]);
const { data: categories } = await useFetch("/api/categories", { headers, default: () => [] });
const { data: imagePrimaryKeys } = await useFetch<string[]>("/api/images/primary-keys", { headers, default: () => [] });
const { data: metadata, refresh: refreshMetadata } = await useAsyncData("metadata", (_nuxtApp, { signal }) =>
  Promise.all([
    $fetch("/api/count", { headers, query: countQuery.value, signal }),
    $fetch("/api/feeds/data", { headers, signal }),
  ]),
);

const {
  data: entries,
  execute: fetchEntries,
  pending,
} = await useFetch("/api/entries", {
  headers,
  query: computed(() => {
    const query: Record<string, string> = {};
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
    query.limit = String(itemsLimit.value);
    query.offset = String(offset.value);
    return query;
  }),
  // when any query parameters change,
  // we first reset the items list and then fetch new data,
  // so we don't need to auto-refetch here
  watch: false,
});
watch(entries, (newItems) => {
  if (!newItems) return;

  if (items.value.length === 0 && newItems.length === 0) {
    if (itemsStatus.value === "unread") {
      if (selectedFeedId.value && selectedCategoryId.value) {
        $q.notify({
          icon: "info",
          message: `No entries found for the selected feed ${getFilteredFeedTitle()}.`,
          actions: [{ icon: "close", color: "white" }],
        });
        selectedFeedId.value = undefined;
        fetchEntries();
        return;
      }
      if (selectedCategoryId.value) {
        $q.notify({
          icon: "info",
          message: `No entries found for the selected category ${getFilteredCategoryName()}.`,
          actions: [{ icon: "close", color: "white" }],
        });
        selectedCategoryId.value = undefined;
        fetchEntries();
        return;
      }
    }
  }

  if (newItems.length < itemsLimit.value) hasMore.value = false;
  for (const item of newItems) {
    items.value.push(item);
    entryRead.value[item.entry.id] = item.entry.readAt ? "read" : "unread";
    entryStar.value[item.entry.id] = item.entry.starredAt ? "starred" : "unstarred";
  }
  offset.value += itemsLimit.value;
});
watchEffect(() => {
  if (!pending.value) $q.loadingBar.stop();
  else $q.loadingBar.start();
});
watch([itemsDirection, itemsLimit, itemsOrder, itemsStatus, searchQuery, selectedCategoryId, selectedFeedId], () => {
  resetThenLoad();
});

const sortedCategories = computed(() => {
  const cats = structuredClone(categories.value);
  cats.sort((a, b) => {
    let comp = 0;
    if (categoriesOrder.value === "unread_count") {
      const aCount = a.feeds.reduce((sum, f) => sum + getFeedUnreadCount(f.id), 0);
      const bCount = b.feeds.reduce((sum, f) => sum + getFeedUnreadCount(f.id), 0);
      comp = aCount - bCount;
    } else if (categoriesOrder.value === "category_name") {
      comp = a.name.localeCompare(b.name);
    }
    if (categoriesDirection.value === "desc") comp = -comp;
    return comp;
  });
  return cats;
});
const countData = computed(() => metadata.value?.[0] ?? { count: 0 });
useHead(() => ({
  title: selectedFeedId.value
    ? `(${countData.value?.count ?? 0}) Feed: ${getFilteredFeedTitle()} - rdr`
    : selectedCategoryId.value
      ? `(${countData.value?.count ?? 0}) Category: ${getFilteredCategoryName()} - rdr`
      : `(${countData.value?.count ?? 0}) rdr`,
}));
const feedsData = computed(() => metadata.value?.[1]);

function cancelScraping(entryId: number) {
  const controller = scrappingControllers.value[entryId];
  if (!controller) return;
  controller.abort();
}

function cancelSummarization(entryId: number) {
  const controller = summarizingControllers.value[entryId];
  if (!controller) return;
  controller.abort();
}

function collapseOpenItem() {
  const index = expanded.value.findIndex((v) => v);
  if (index === -1) return;
  expanded.value[index] = false;
  scrollToContentRef(index);
}

type DatePart = "day" | "week" | "month" | "year";
type MarkAsReadParam = { type: "before"; value: Date } | { type: "olderThan"; value: DatePart };

async function doMarkManyAsRead(param: MarkAsReadParam) {
  const now = new Date();

  const body: Record<string, unknown> = {};
  if (param.type === "before" && param.value instanceof Date) {
    body.before = param.value.toISOString();
  }
  if (param.type === "olderThan") {
    body.olderThan = param.value;
  }

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
      if (shouldMarkAsRead(now, item.entry.id, param)) entryRead.value[item.entry.id] = "read";
    refreshMetadata();
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

function getCategoryUnreadCount(categoryId: number): number {
  if (!feedsData.value) return 0;
  const feedIds = categories.value?.filter((c) => c.id === categoryId).flatMap((c) => c.feeds.map((f) => f.id)) ?? [];
  return feedIds.reduce((sum, feedId) => sum + (feedsData.value?.feeds[feedId]?.unreadCount ?? 0), 0);
}

function getContent(entryId: number): string {
  return fullContents.value[entryId] ?? contents.value[entryId] ?? "";
}

function getFeedUnreadCount(feedId: number): number {
  if (!feedsData.value) return 0;
  return feedsData.value?.feeds[feedId]?.unreadCount ?? 0;
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

async function getFullContent(entryId: number) {
  if (fullContents.value[entryId]) return;

  const controller = new AbortController();
  scrappingControllers.value[entryId] = controller;

  scrapping.value[entryId] = true;
  try {
    const parsed = await $fetch(`/api/entries/${entryId}/full-content`, {
      signal: controller.signal,
    });
    if (parsed && parsed.content) fullContents.value[entryId] = parsed.content;
  } catch (err) {
    if (scrappingControllers.value[entryId]?.signal.aborted) {
      $q.notify({
        type: "info",
        message: "Full content download cancelled.",
        actions: [{ icon: "close", color: "white" }],
      });
    } else {
      $q.notify({
        type: "negative",
        message: `Failed to download full content: ${err}`,
        actions: [{ icon: "close", color: "white" }],
      });
    }
  } finally {
    scrapping.value[entryId] = false;
  }
}

async function loadContent(entryId: number) {
  if (contents.value[entryId]) return;

  if (contentLoading.value[entryId]) return;
  contentLoading.value[entryId] = true;

  try {
    const { content } = await $fetch(`/api/entries/${entryId}/content`);
    contents.value[entryId] = content;
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to load entry content: ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
  } finally {
    contentLoading.value[entryId] = false;
  }
}

function isImageExists(feedId: number): boolean {
  const key = buildFeedImageKey(feedId);
  return imagePrimaryKeys.value?.includes(key) ?? false;
}

function isOpenEntryStarred() {
  const index = expanded.value.findIndex((v) => v);
  if (index === -1) return false;

  const item = items.value[index];
  if (item) return entryStar.value[item.entry.id] === "starred";
  return false;
}

function isRead(entryId: number): boolean {
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
  }).onOk(async (olderThan: "day" | "week" | "month" | "year" | "all") => {
    const mostRecentDate = items.value.reduce<Date | null>((latest, item) => {
      const itemDate = new Date(item.entry.date);
      if (!latest || itemDate > latest) return itemDate;
      return latest;
    }, null);
    if (olderThan === "all") {
      if (!mostRecentDate) {
        $q.notify({
          type: "info",
          message: "No entries to mark as read.",
          actions: [{ icon: "close", color: "white" }],
        });
        return;
      }
      await doMarkManyAsRead({ type: "before", value: mostRecentDate });
    } else {
      await doMarkManyAsRead({ type: "olderThan", value: olderThan });
    }
  });
}

async function markAsRead(entryId: number) {
  if (entryRead.value[entryId] === "read") return;
  const value = entryRead.value[entryId];
  const title = items.value.find((i) => i.entry.id === entryId)?.entry.title ?? "";
  try {
    entryRead.value[entryId] = "toggling";
    await $fetch(`/api/entries/${entryId}/read`, { method: "PUT" });
    entryRead.value[entryId] = "read";
    await refreshMetadata();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to mark entry "${title}" as read: ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
    if (value) entryRead.value[entryId] = value;
  }
}

async function markAsReadAndCollapse(entryId: number, index: number) {
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

async function onLoad(_index: number, done: (stop?: boolean) => void) {
  if (!hasMore.value) {
    if (done) done(true);
    return;
  }
  await fetchEntries();
  if (done) done();
}

async function resetThenLoad(done?: (stop?: boolean) => void) {
  // @ts-expect-error: stop exists
  infiniteScroll.value?.stop();
  try {
    contents.value = {};
    fullContents.value = {};
    entryRead.value = {};
    entryStar.value = {};
    expanded.value = [];
    hasMore.value = true;
    items.value = [];
    offset.value = 0;
    saving.value = {};
    scrapping.value = {};
    scrappingControllers.value = {};
    // intentionally not resetting summarizations to preserve cached data
    // summarizations.value = {};
    summarizing.value = {};
    summarizingControllers.value = {};

    await Promise.all([refreshMetadata(), fetchEntries()]);
  } catch (e) {
    console.error("Error in resetThenLoad:", e);
  } finally {
    // @ts-expect-error: resume exists
    infiniteScroll.value?.resume();
    if (done) done();
  }
}

async function saveEntry(entryId: number) {
  if (saving.value[entryId]) return;
  saving.value[entryId] = true;

  const title = items.value.find((i) => i.entry.id === entryId)?.entry.title ?? "";
  try {
    await $fetch(`/api/entries/${entryId}/save`, { method: "POST" });
    $q.notify({
      type: "positive",
      message: `Entry "${title}" saved successfully.`,
      actions: [{ icon: "close", color: "white" }],
    });
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to save entry "${title}": ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
  } finally {
    saving.value[entryId] = false;
  }
}

function scrollToContentRef(index: number) {
  // @ts-expect-error: scrollIntoView exists
  itemRefs.value?.[index]?.$el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function shouldMarkAsRead(now: Date, entryId: number, param: MarkAsReadParam): boolean {
  if (entryRead.value[entryId] === "read") return true;

  const item = items.value.find((i) => i.entry.id === entryId);
  if (!item) return false;

  if (param.type === "before" && param.value instanceof Date) {
    const entryDate = new Date(item.entry.date);
    return entryDate <= param.value;
  }

  if (param.type === "olderThan" && param.value) {
    const entryDate = new Date(item.entry.date);
    switch (param.value) {
      case "day":
        return entryDate < add(now, { days: -1 });
      case "week":
        return entryDate < add(now, { days: -7 });
      case "month":
        return entryDate < add(now, { months: -1 });
      case "year":
        return entryDate < add(now, { years: -1 });
      default:
        return false;
    }
  }

  return false;
}

function shouldShowCategory(categoryId: number): boolean {
  const category = categories.value?.find((c) => c.id === categoryId);
  if (!category) return false;

  if (categoryFeedQuery.value) {
    const categoryMatched = category.name.toLowerCase().includes(categoryFeedQuery.value.toLowerCase());
    const feedMatched = category.feeds.some((f) =>
      f.title.toLowerCase().includes(categoryFeedQuery.value.toLowerCase()),
    );
    return categoryMatched || feedMatched;
  }

  if (hideEmpty.value) return getCategoryUnreadCount(categoryId) > 0;

  return true;
}

function shouldShowFeed(feedId: number): boolean {
  const feeds = categories.value?.flatMap((c) => c.feeds) ?? [];
  const feed = feeds.find((f) => f.id === feedId);
  if (!feed) return false;

  if (categoryFeedQuery.value) return feed.title.toLowerCase().includes(categoryFeedQuery.value.toLowerCase());

  if (hideEmpty.value) return getFeedUnreadCount(feedId) > 0;

  return true;
}

async function slideLeft(entryId: number, index: number, done: () => void) {
  entryStar.value[entryId] = entryStar.value[entryId] === "starred" ? "unstarred" : "starred";
  await toggleStarEntry(entryId);
  done();
}

async function slideRight(entryId: number, index: number, done: () => void) {
  entryRead.value[entryId] = entryRead.value[entryId] === "read" ? "unread" : "read";
  await toggleReadEntry(entryId, index);
  done();
}

async function summarizeEntry(entryId: number) {
  const entry = items.value.find((i) => i.entry.id === entryId);
  if (!entry) return;

  const controller = new AbortController();
  summarizingControllers.value[entryId] = controller;

  if (summarizing.value[entryId]) return;
  summarizing.value[entryId] = true;

  const entryTitle = entry.entry.title ?? "Untitled";
  try {
    const text = await $fetch(`/api/entries/${entryId}/summarize`, { signal: controller.signal });

    const [prefixedTitle, content] = text.split("\n\n");
    const title = replaceForTiddlyWiki((prefixedTitle ?? "").replace("Title: ", ""));

    summarizations.value[entryId] = `${pangu.spacingText(title)}

${entry.entry.link}

${pangu.spacingText(content ?? "")}`;
  } catch (err) {
    if (summarizingControllers.value[entryId]?.signal.aborted) {
      $q.notify({
        type: "info",
        message: `Summarization for entry ${entryTitle} was canceled.`,
        actions: [{ icon: "close", color: "white" }],
      });
    } else {
      $q.notify({
        type: "negative",
        message: `Failed to summarize entry ${entryTitle}: ${err}`,
        actions: [{ icon: "close", color: "white" }],
      });
    }
  } finally {
    summarizing.value[entryId] = false;
  }
}

async function toggleReadEntry(entryId: number, index: number) {
  if (entryRead.value[entryId] === "toggling") return;
  // status of checkbox is already changed by the time this function is called
  const value = entryRead.value[entryId];
  entryRead.value[entryId] = "toggling";

  const title = items.value.find((i) => i.entry.id === entryId)?.entry.title ?? "";
  try {
    await $fetch(`/api/entries/${entryId}/read`, { method: "PUT" });
    refreshMetadata();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to toggle entry "${title}": ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
  } finally {
    if (value) entryRead.value[entryId] = value;
    if (value === "read") expanded.value[index] = false;
  }
}

async function toggleStarEntry(entryId: number) {
  if (entryStar.value[entryId] === "starring") return;
  // status of checkbox is already changed by the time this function is called
  const value = entryStar.value[entryId];
  entryStar.value[entryId] = "starring";

  const title = items.value.find((i) => i.entry.id === entryId)?.entry.title ?? "";
  try {
    await $fetch(`/api/entries/${entryId}/star`, { method: "PUT" });
    refreshMetadata();
    if (value) entryStar.value[entryId] = value;
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to toggle star for entry "${title}": ${err}`,
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
@import url("~/assets/css/entry-content.css");
@import url("~/assets/css/entry-summary.css");
</style>
