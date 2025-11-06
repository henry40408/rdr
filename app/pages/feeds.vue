<template>
  <q-layout v-if="loggedIn" view="hhh LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          <q-avatar>
            <q-icon name="rss_feed" />
          </q-avatar>
          rdr
        </q-toolbar-title>
        <NavTabs />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page>
        <q-list padding>
          <q-item header>New Feed</q-item>
          <q-item>
            <q-item-section>
              <q-select
                v-model="categoryName"
                outlined
                use-chips
                use-input
                label="Category Name"
                :options="filteredCategoryOptions"
                hint="Create a new category by typing a name and pressing Enter. Clear to select existing."
                @new-value="addCategory"
                @filter="filterCategories"
              />
              <q-input v-model="xmlUrl" outlined type="url" class="q-mt-sm" label="Feed URL" />
              <q-input v-model="htmlUrl" outlined type="url" class="q-mt-sm" label="Website URL (Optional)" />
              <q-btn
                class="q-mt-sm"
                color="primary"
                label="Add Feed"
                :loading="adding"
                :disable="!(categoryName && xmlUrl)"
                @click="addFeed()"
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Feeds</q-item-label>
              <q-item-label caption>Manage your feed subscriptions</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-toggle v-model="hideEmpty" label="Hide empty" />
              <q-toggle v-model="showErrorOnly" label="Show error only" />
            </q-item-section>
          </q-item>
          <template v-for="category in categories" :key="category.id">
            <q-expansion-item v-show="shouldShowCategory(category.id)" group="category">
              <template #header>
                <q-item-section
                  v-ripple
                  clickable
                  @click="() => $router.push({ path: '/', query: { categoryId: category.id } })"
                >
                  <q-item-label>{{ category.name }}</q-item-label>
                </q-item-section>
                <q-item-section top side>
                  <q-item-label caption>{{ category.feeds.length }} feeds</q-item-label>
                  <div class="q-mt-xs">
                    <q-badge color="primary" :outline="!getCategoryUnreadCount(category.id)">
                      {{ getCategoryUnreadCount(category.id) }}
                    </q-badge>
                  </div>
                </q-item-section>
              </template>

              <q-card>
                <q-card-section>
                  <q-btn-group>
                    <q-btn
                      icon="edit"
                      label="Edit"
                      color="primary"
                      @click="updateCategoryDialog(category.id, category.name)"
                    />
                    <q-btn
                      icon="refresh"
                      color="primary"
                      label="Refresh"
                      :loading="refreshingCategoryIds.has(category.id)"
                      @click="refreshCategory(category)"
                    />
                    <q-btn icon="delete" label="Delete" color="negative" @click="deleteCategoryDialog(category.id)" />
                  </q-btn-group>
                </q-card-section>
              </q-card>
            </q-expansion-item>
            <q-list separator>
              <template v-for="feed in category.feeds" :key="feed.id">
                <q-expansion-item
                  v-show="shouldShowFeed(feed.id)"
                  expand-icon-toggle
                  :group="`category-${category.id}`"
                >
                  <template #header>
                    <q-item-section avatar>
                      <q-avatar v-if="imageExists(feed.id)" square>
                        <img
                          loading="lazy"
                          alt="Feed image"
                          decoding="async"
                          :class="{ 'bg-white': isDark }"
                          :src="`/api/images/external/${buildFeedImageKey(feed.id)}`"
                        />
                      </q-avatar>
                      <q-icon v-else name="rss_feed" class="feed-image" />
                    </q-item-section>
                    <q-item-section
                      v-ripple
                      clickable
                      @click="() => $router.push({ path: '/', query: { feedId: feed.id } })"
                    >
                      <q-item-label lines="1">
                        <span
                          :class="{
                            'text-negative': feedDataByFeedId[feed.id]?.lastError,
                          }"
                          >{{ feed.title }}</span
                        >
                      </q-item-label>
                    </q-item-section>
                    <q-item-section top side>
                      <q-item-label caption>{{ formatFetchedAtToNow(feed.id) }}</q-item-label>
                      <div class="q-mt-xs">
                        <q-badge color="primary" :outline="!getFeedUnreadCount(feed.id)">{{
                          getFeedUnreadCount(feed.id)
                        }}</q-badge>
                      </div>
                    </q-item-section>
                  </template>

                  <q-list padding>
                    <q-item>
                      <q-item-section>
                        <q-item-label overline>ERROR COUNT</q-item-label>
                        <q-item-label>{{ feedDataByFeedId[feed.id]?.errorCount }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label overline>LAST ERROR</q-item-label>
                        <q-item-label>{{ feedDataByFeedId[feed.id]?.lastError || "-" }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <div>
                          <q-btn-group push>
                            <q-btn
                              icon="refresh"
                              label="Refresh"
                              :loading="refreshingFeedIds.has(feed.id)"
                              @click="refreshFeed(feed)"
                            />
                            <q-btn
                              label="Website"
                              target="_blank"
                              icon="open_in_new"
                              :href="feed.htmlUrl"
                              rel="noopener noreferrer"
                            />
                            <q-btn icon="delete" label="Delete" color="negative" @click="deleteFeedDialog(feed.id)" />
                          </q-btn-group>
                        </div>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-expansion-item>
              </template>
            </q-list>
          </template>
        </q-list>
        <q-banner v-if="categories.length <= 0" :class="{ 'bg-grey-9': isDark, 'bg-grey-3': !isDark }">
          <template #avatar>
            <q-icon name="info" />
          </template>

          <div>No categories found</div>
          <div class="text-caption">
            Try adjusting your filters or
            <router-link to="/settings">add new feeds</router-link>.
          </div>
        </q-banner>

        <q-page-sticky :offset="[18, 18]" position="bottom-right">
          <q-btn fab icon="refresh" color="primary" @click="refreshAll()" />
        </q-page-sticky>
      </q-page>
    </q-page-container>
  </q-layout>
  <LoginPage v-else />
</template>

<script setup>
import CategoryDialog from "../components/CategoryDialog.vue";
import { formatDistanceToNow } from "date-fns";
import { useQuasar } from "quasar";

const requestFetch = useRequestFetch();
const { loggedIn } = useUserSession();

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

const { hideEmpty } = useLocalSettings();

// New feed form fields
const adding = ref(false);
/** @type {Ref<string|null>} */
const categoryName = ref(null);
/** @type {Ref<string[]>} */
const filteredCategoryOptions = ref([]);
const htmlUrl = ref("");
const xmlUrl = ref("");

/** @type {Ref<Set<number>>} */
const refreshingCategoryIds = ref(new Set());
/** @type {Ref<Set<number>>} */
const refreshingFeedIds = ref(new Set());
/** @type {Ref<boolean>} */
const showErrorOnly = ref(false);

const { data, refresh } = await useAsyncData(() =>
  Promise.all([requestFetch("/api/categories"), requestFetch("/api/feeds/data")]),
);
const categories = computed(() => data.value?.[0] ?? []);

const categoryOptions = computed(() => (categories.value ?? []).map((category) => category.name));
watchEffect(() => {
  filteredCategoryOptions.value = categoryOptions.value;
});

const feedDataByFeedId = computed(() => data.value?.[1]?.feeds ?? {});

/**
 * @param {string} inputValue
 * @param {(val: string, mode: 'add'|'add-unique'|'toggle') => void} doneFn
 */
function addCategory(inputValue, doneFn) {
  if (inputValue && !categoryOptions.value.includes(inputValue)) {
    categoryName.value = inputValue;
  }
  doneFn(inputValue, "toggle");
}

async function addFeed() {
  adding.value = true;
  try {
    await requestFetch("/api/feeds", {
      method: "POST",
      body: {
        categoryName: categoryName.value,
        htmlUrl: htmlUrl.value || undefined, // treat empty string as undefined
        xmlUrl: xmlUrl.value,
      },
    });
    categoryName.value = "";
    htmlUrl.value = "";
    xmlUrl.value = "";
    await refresh();
    $q.notify({
      type: "positive",
      message: "Feed added successfully",
      actions: [{ icon: "close", color: "white" }],
    });
  } catch (e) {
    $q.notify({
      type: "negative",
      message: `Error adding feed: ${e}`,
      actions: [{ icon: "close", color: "white" }],
    });
  } finally {
    adding.value = false;
  }
}

/**
 * @param {number} categoryId
 */
function deleteCategoryDialog(categoryId) {
  $q.dialog({
    title: "Delete Category",
    message: "Are you sure you want to delete this category and all its feeds? This action cannot be undone.",
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await requestFetch(`/api/categories/${categoryId}`, { method: "DELETE" });
      await refresh();
      $q.notify({
        type: "positive",
        message: "Category deleted successfully",
        actions: [{ icon: "close", color: "white" }],
      });
    } catch (err) {
      $q.notify({
        type: "negative",
        message: `Error deleting category: ${err}`,
        actions: [{ icon: "close", color: "white" }],
      });
    }
  });
}

/**
 * @param {number} feedId
 */
function deleteFeedDialog(feedId) {
  $q.dialog({
    title: "Delete Feed",
    message: "Are you sure you want to delete this feed? This action cannot be undone.",
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await requestFetch(`/api/feeds/${feedId}`, { method: "DELETE" });
      await refresh();
      $q.notify({
        type: "positive",
        message: "Feed deleted successfully",
        actions: [{ icon: "close", color: "white" }],
      });
    } catch (err) {
      $q.notify({
        type: "negative",
        message: `Error deleting feed: ${err}`,
        actions: [{ icon: "close", color: "white" }],
      });
    }
  });
}

/**
 *
 * @param {string} inputValue
 * @param {(callbackFn: () => void, afterFn?: (component: import('quasar').QSelect) => void) => void} doneFn
 * @param {() => void} _abortFn
 */
function filterCategories(inputValue, doneFn, _abortFn) {
  doneFn(() => {
    if (!inputValue) {
      filteredCategoryOptions.value = categoryOptions.value;
    } else {
      const filter = inputValue.toLowerCase();
      filteredCategoryOptions.value = categoryOptions.value.filter((option) => option.toLowerCase().includes(filter));
    }
  });
}

/**
 * @param {number} feedId
 * @returns {string}
 */
function formatFetchedAtToNow(feedId) {
  const fetchedAt = feedDataByFeedId.value?.[feedId]?.fetchedAt;
  if (!fetchedAt) return "never";
  return formatDistanceToNow(new Date(fetchedAt), { addSuffix: true });
}

/**
 * @param {number} categoryId
 * @returns {number}
 */
function getCategoryUnreadCount(categoryId) {
  const category = categories.value?.find((c) => c.id === categoryId);
  if (!category) return 0;
  return category.feeds.reduce((sum, feed) => {
    const feedData = feedDataByFeedId.value[feed.id];
    return sum + (feedData?.unreadCount ?? 0);
  }, 0);
}

/**
 * @param {number} feedId
 * @returns {number}
 */
function getFeedUnreadCount(feedId) {
  return feedDataByFeedId.value[feedId]?.unreadCount ?? 0;
}

/**
 * @param {number} feedId
 * @returns {boolean}
 */
function imageExists(feedId) {
  return feedDataByFeedId.value[feedId]?.imageExists ?? false;
}

async function refreshAll() {
  if (refreshingCategoryIds.value.size > 0) return;
  if (!categories.value) return;

  const tasks = [];
  for (const category of categories.value) tasks.push(refreshCategory(category));
  await Promise.allSettled(tasks);
}

/**
 * @param {CategoryEntity} category
 */
async function refreshCategory(category) {
  const feedIds = category.feeds.map((feed) => feed.id);

  refreshingCategoryIds.value.add(category.id);
  for (const feedId of feedIds) refreshingFeedIds.value.add(feedId);

  try {
    const tasks = [];
    for (const feedId of feedIds) tasks.push(requestFetch(`/api/feeds/${feedId}/refresh`, { method: "POST" }));
    await Promise.all(tasks);
    await refresh();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Error refreshing category ${category.name}: ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
  } finally {
    for (const feedId of feedIds) refreshingFeedIds.value.delete(feedId);
    refreshingCategoryIds.value.delete(category.id);
  }
}

/**
 * @param {FeedEntity} feed
 */
async function refreshFeed(feed) {
  if (refreshingFeedIds.value.has(feed.id)) return;
  refreshingFeedIds.value.add(feed.id);
  try {
    await requestFetch(`/api/feeds/${feed.id}/refresh`, { method: "POST" });
    await refresh();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Error refreshing feed ${feed.title}: ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
  } finally {
    refreshingFeedIds.value.delete(feed.id);
  }
}

/**
 * @param {number} categoryId
 */
function shouldShowCategory(categoryId) {
  if (!hideEmpty.value && !showErrorOnly.value) return true;

  const category = categories.value?.find((c) => c.id === categoryId);
  if (!category) return false;

  if (showErrorOnly.value) {
    for (const feed of category.feeds) {
      const feedData = feedDataByFeedId.value[feed.id];
      if (feedData?.lastError) return true;
    }
    return false;
  }

  return getCategoryUnreadCount(categoryId) > 0;
}

/**
 * @param {number} feedId
 */
function shouldShowFeed(feedId) {
  if (!hideEmpty.value && !showErrorOnly.value) return true;

  if (showErrorOnly.value) {
    const feedData = feedDataByFeedId.value[feedId];
    return !!feedData?.lastError;
  }

  return getFeedUnreadCount(feedId) > 0;
}

/**
 * @param {number} categoryId
 * @param {string} name
 */
async function updateCategoryDialog(categoryId, name) {
  $q.dialog({
    component: CategoryDialog,
    componentProps: {
      id: categoryId,
      name,
    },
  }).onOk(
    /**
     * @param {object} data
     * @param {string} data.name
     */
    async (data) => {
      try {
        await requestFetch(`/api/categories/${categoryId}`, {
          method: "PATCH",
          body: { name: data.name },
        });
        await refresh();
        $q.notify({
          type: "positive",
          message: "Category updated successfully",
          actions: [{ icon: "close", color: "white" }],
        });
      } catch (err) {
        $q.notify({
          type: "negative",
          message: `Error updating category: ${err}`,
          actions: [{ icon: "close", color: "white" }],
        });
      }
    },
  );
}
</script>
