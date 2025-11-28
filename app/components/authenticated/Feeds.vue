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
          v-model="categoryFeedQuery"
          dark
          dense
          filled
          debounce="500"
          input-class="text-right"
          placeholder="Search categories and / or feeds"
        >
          <template #append>
            <q-icon v-if="!categoryFeedQuery" name="search" />
            <q-icon v-else name="clear" class="cursor-pointer" @click="categoryFeedQuery = ''" />
          </template>
        </q-input>
        <NavTabs />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered persistent side="left" show-if-above>
      <q-list padding>
        <q-item-label header>Navigation</q-item-label>
        <q-item clickable @click="$router.push({ hash: '#subscriptions' })">
          <q-item-section>Subscriptions</q-item-section>
        </q-item>
        <q-item clickable @click="$router.push({ hash: '#new-feed' })">
          <q-item-section>New Feed</q-item-section>
        </q-item>
        <q-item clickable @click="$router.push({ hash: '#feeds' })">
          <q-item-section>Feeds</q-item-section>
        </q-item>
        <q-separator spaced />
        <q-item-label header>Categories</q-item-label>
        <template v-for="category in categories" :key="category.id">
          <q-item clickable @click="$router.push({ hash: `#category-${category.id}` })">
            <q-item-section>{{ category.name }}</q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>

    <q-page-container>
      <q-page>
        <q-list padding class="q-pb-xl">
          <q-item id="subscriptions">
            <q-item-section>Subscriptions</q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-file v-model="uploadedFile" label="Upload OPML *">
                <template #prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
            </q-item-section>
            <q-item-section side>
              <q-btn
                label="Import"
                class="q-ml-sm"
                color="primary"
                :loading="uploading"
                :disabled="!uploadedFile"
                @click="importOPML"
              />
            </q-item-section>
            <q-item-section side>
              <q-btn label="Export" color="primary" href="/api/opml" />
            </q-item-section>
          </q-item>
          <q-separator spaced />
          <q-item id="new-feed">
            <q-item-section>New Feed</q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <CategoryInput v-model="categoryName" :category-list="categoryOptions" />
              <div class="text-caption q-px-sm">
                Create a new category by typing a name and pressing Enter. Clear to select existing.
              </div>
              <q-input v-model="xmlUrl" outlined type="url" class="q-mt-sm" label="URL to discover feed *" />
              <div class="text-caption q-px-sm">
                Enter the website or feed URL. The system will try to discover the feed automatically.
              </div>
              <q-input v-model="htmlUrl" outlined type="url" class="q-mt-sm" label="Website URL" />
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
          <q-separator spaced />
          <q-item id="feeds">
            <q-item-section>
              <q-item-label>Feeds</q-item-label>
              <q-item-label caption>Manage your feed subscriptions</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <ClientOnly>
                <div class="row q-gutter-sm">
                  <q-toggle v-model="hideEmpty" label="Hide empty" />
                  <q-toggle v-model="showErrorOnly" label="Show error only" />
                </div>
              </ClientOnly>
            </q-item-section>
          </q-item>
          <template v-for="category in categories" :key="category.id">
            <q-expansion-item v-show="shouldShowCategory(category.id)" :id="`category-${category.id}`" group="category">
              <template #header>
                <q-item-section
                  v-ripple
                  clickable
                  @click="() => $router.push({ path: '/', query: { categoryId: category.id } })"
                >
                  <MarkedText :text="category.name" :keyword="categoryFeedQuery" />
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
                  <q-btn-group push>
                    <q-btn icon="edit" @click="updateCategoryDialog(category.id)" />
                    <q-btn
                      icon="refresh"
                      :loading="refreshingCategoryIds.has(category.id)"
                      @click="refreshCategory(category)"
                    />
                    <q-btn icon="delete" color="negative" @click="deleteCategoryDialog(category.id)" />
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
                    <q-item-section side>
                      <q-avatar square size="xs">
                        <img
                          v-if="isImageExists(feed.id)"
                          loading="lazy"
                          alt="Feed image"
                          decoding="async"
                          :class="{ 'bg-white': isDark }"
                          :src="`/api/images/external/${buildFeedImageKey(feed.id)}`"
                        />
                      </q-avatar>
                    </q-item-section>
                    <q-item-section
                      v-ripple
                      clickable
                      @click="() => $router.push({ path: '/', query: { feedId: feed.id } })"
                    >
                      <q-item-label lines="1">
                        <span
                          :class="{
                            'text-negative text-weight-bold': feed.lastError !== null,
                          }"
                        >
                          <MarkedText :text="feed.title" :keyword="categoryFeedQuery" />
                        </span>
                      </q-item-label>
                    </q-item-section>
                    <q-item-section top side>
                      <q-item-label caption>
                        <ClientAgo :datetime="feed.feedUpdatedAt" />
                      </q-item-label>
                      <div class="q-mt-xs">
                        <q-badge color="primary" :outline="!getFeedUnreadCount(feed.id)">
                          {{ getFeedUnreadCount(feed.id) }}
                        </q-badge>
                      </div>
                    </q-item-section>
                  </template>

                  <q-list padding>
                    <q-item>
                      <q-item-section>
                        <q-item-label caption>Feed updated at</q-item-label>
                        <q-item-label><ClientAgo :datetime="feed.feedUpdatedAt" /></q-item-label>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label caption>Fetched at</q-item-label>
                        <q-item-label><ClientAgo :datetime="feed.fetchedAt" /></q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label caption>Error count</q-item-label>
                        <q-item-label>{{ feed.errorCount }}</q-item-label>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label caption>Last error</q-item-label>
                        <q-item-label>
                          {{ feed.lastError ?? "-" }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label caption>HTTP protocol</q-item-label>
                        <q-item-label>
                          <q-badge color="primary" :outline="!feed.disableHttp2">
                            {{ feed.disableHttp2 ? "HTTP/1.1" : "HTTP/2" }}
                          </q-badge>
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label caption>User agent</q-item-label>
                        <q-item-label>{{ feed.userAgent ?? "-" }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <div>
                          <q-btn-group push>
                            <q-btn icon="edit" @click="updateFeedDialog(feed.id)" />
                            <q-btn
                              icon="refresh"
                              :loading="refreshingFeedIds.has(feed.id)"
                              @click="refreshFeed(feed)"
                            />
                            <q-btn icon="delete" color="negative" @click="deleteFeedDialog(feed.id)" />
                            <q-btn
                              icon="web"
                              label="Website"
                              target="_blank"
                              :href="feed.htmlUrl"
                              rel="noopener noreferrer"
                            />
                          </q-btn-group>
                        </div>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-expansion-item>
              </template>
            </q-list>
          </template>
          <q-item v-if="shouldShowNoCategories" :class="{ 'q-pa-md': true, 'bg-grey-9': isDark, 'bg-grey-3': !isDark }">
            <q-item-section side>
              <q-icon name="info" />
            </q-item-section>
            <q-item-section>
              <q-item-label>No categories or feeds match the current filters.</q-item-label>
              <q-item-label caption
                >Try adjusting the search query or toggles above to find your subscriptions.</q-item-label
              >
            </q-item-section>
          </q-item>
        </q-list>

        <q-page-sticky :offset="[18, 18]" position="bottom-right">
          <q-btn fab padding="sm" icon="refresh" color="primary" :loading="refreshingAll" @click="refreshAll()" />
        </q-page-sticky>
      </q-page>
    </q-page-container>
  </q-layout>
  <LoginPage v-else />
</template>

<script setup lang="ts">
import CategoryDialog from "../CategoryDialog.vue";
import FeedDialog from "../FeedDialog.vue";
import { useQuasar } from "quasar";

useHead({
  title: "Feeds - rdr",
});

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
const categoryName: Ref<string | null> = ref(null);
const htmlUrl = ref("");
const xmlUrl = ref("");

const categoryFeedQuery = ref("");
const leftDrawerOpen = ref(false);
const refreshingAll = ref(false);
const refreshingCategoryIds: Ref<Set<number>> = ref(new Set());
const refreshingFeedIds: Ref<Set<number>> = ref(new Set());
const showErrorOnly: Ref<boolean> = ref(false);
const uploadedFile = ref(null);
const uploading = ref(false);

const headers = useRequestHeaders(["cookie"]);
const { data: categories, refresh } = await useFetch("/api/categories", { headers });

const categoryOptions = computed(() => (categories.value ?? []).map((category) => category.name));

const shouldShowNoCategories = computed(() => {
  for (const category of categories.value ?? []) if (shouldShowCategory(category.id)) return false;
  return true;
});

async function addFeed() {
  adding.value = true;
  try {
    await $fetch("/api/feeds", {
      method: "POST",
      body: {
        categoryName: categoryName.value,
        htmlUrl: htmlUrl.value || undefined, // treat empty string as undefined
        xmlUrl: xmlUrl.value,
      },
    });
    refresh();
    categoryName.value = null;
    htmlUrl.value = "";
    xmlUrl.value = "";
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

function deleteCategoryDialog(categoryId: number) {
  $q.dialog({
    title: "Delete Category",
    message: "Are you sure you want to delete this category and all its feeds? This action cannot be undone.",
    cancel: true,
    ok: { color: "negative" },
  }).onOk(async () => {
    try {
      await $fetch(`/api/categories/${categoryId}`, { method: "DELETE" });
      refresh();
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

function deleteFeedDialog(feedId: number) {
  $q.dialog({
    title: "Delete Feed",
    message: "Are you sure you want to delete this feed? This action cannot be undone.",
    cancel: true,
    ok: { color: "negative" },
  }).onOk(async () => {
    try {
      await $fetch(`/api/feeds/${feedId}`, { method: "DELETE" });
      refresh();
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

function getCategoryUnreadCount(categoryId: number): number {
  const category = categories.value?.find((c) => c.id === categoryId);
  if (!category) return 0;
  return category.feeds.reduce((sum, feed) => sum + feed.unreadCount, 0);
}

function getFeedUnreadCount(feedId: number): number {
  const feed = categories.value?.flatMap((c) => c.feeds).find((f) => f.id === feedId);
  if (!feed) return 0;
  return feed.unreadCount;
}

async function importOPML() {
  if (!uploadedFile.value) return;
  const formData = new FormData();
  formData.append("file", uploadedFile.value);

  if (uploading.value) return;
  uploading.value = true;

  try {
    await $fetch("/api/opml", { method: "POST", body: formData });
    uploadedFile.value = null;
    $q.notify({
      type: "positive",
      message: "OPML file imported successfully",
    });
    refresh();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to import OPML file: ${err}`,
    });
  } finally {
    uploading.value = false;
  }
}

function isImageExists(feedId: number): boolean {
  const feed = categories.value?.flatMap((c) => c.feeds).find((f) => f.id === feedId);
  return feed?.imageExists ?? false;
}

async function refreshAll() {
  if (refreshingCategoryIds.value.size > 0) return;
  if (!categories.value) return;

  $q.notify({ icon: "info", message: "Refreshing all feeds..." });

  refreshingAll.value = true;
  try {
    const tasks = [];
    for (const category of categories.value) tasks.push(refreshCategory(category));
    await Promise.allSettled(tasks);
  } finally {
    refreshingAll.value = false;
  }
}

async function refreshCategory(category: CategoryEntity) {
  const feedIds = category.feeds.map((feed) => feed.id);

  refreshingCategoryIds.value.add(category.id);
  for (const feedId of feedIds) refreshingFeedIds.value.add(feedId);

  try {
    const tasks = [];
    for (const feedId of feedIds) tasks.push($fetch(`/api/feeds/${feedId}/refresh`, { method: "POST" }));
    await Promise.all(tasks);
    refresh();
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

async function refreshFeed(feed: FeedEntity) {
  if (refreshingFeedIds.value.has(feed.id)) return;
  refreshingFeedIds.value.add(feed.id);
  try {
    await $fetch(`/api/feeds/${feed.id}/refresh`, { method: "POST" });
    refresh();
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

function shouldShowCategory(categoryId: number) {
  const category = categories.value?.find((c) => c.id === categoryId);
  if (!category) return false;

  if (categoryFeedQuery.value) {
    const categoryMatched = category.name.toLowerCase().includes(categoryFeedQuery.value.toLowerCase());
    const feedMatched = category.feeds.some((f) =>
      f.title.toLowerCase().includes(categoryFeedQuery.value.toLowerCase()),
    );
    return categoryMatched || feedMatched;
  }

  if (showErrorOnly.value) {
    for (const feed of category.feeds) {
      if (feed.lastError !== null) return true;
    }
    return false;
  }

  if (hideEmpty.value) return getCategoryUnreadCount(categoryId) > 0;

  return true;
}

function shouldShowFeed(feedId: number) {
  const feed = categories.value?.flatMap((c) => c.feeds).find((f) => f.id === feedId);
  if (!feed) return false;

  if (categoryFeedQuery.value) return feed.title.toLowerCase().includes(categoryFeedQuery.value.toLowerCase());

  if (showErrorOnly.value) return feed.lastError !== null;

  if (hideEmpty.value) return getFeedUnreadCount(feedId) > 0;

  return true;
}

async function updateCategoryDialog(categoryId: number) {
  const category = categories.value?.find((c) => c.id === categoryId);
  if (!category) return;

  $q.dialog({
    component: CategoryDialog,
    componentProps: {
      id: categoryId,
      name: category.name,
    },
  }).onOk(async (data: { name: string }) => {
    try {
      await $fetch(`/api/categories/${categoryId}`, {
        method: "PATCH",
        body: { name: data.name },
      });
      refresh();
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
  });
}

async function updateFeedDialog(feedId: number) {
  const category = categories.value?.find((c) => c.feeds.some((f) => f.id === feedId));
  if (!category) return;

  const feed = category.feeds.find((f) => f.id === feedId);
  if (!feed) return;

  $q.dialog({
    component: FeedDialog,
    componentProps: {
      id: feedId,
      categoryName: category.name,
      title: feed.title,
      xmlUrl: feed.xmlUrl,
      htmlUrl: feed.htmlUrl,
      disableHttp2: feed.disableHttp2,
      userAgent: feed.userAgent || "",
    },
  }).onOk(
    async (data: {
      categoryName: string;
      title: string;
      xmlUrl: string;
      htmlUrl?: string;
      disableHttp2?: boolean;
      userAgent?: string;
    }) => {
      try {
        await $fetch(`/api/feeds/${feedId}`, {
          method: "PATCH",
          body: {
            categoryName: data.categoryName,
            title: data.title,
            xmlUrl: data.xmlUrl,
            htmlUrl: data.htmlUrl,
            disableHttp2: data.disableHttp2,
            userAgent: data.userAgent,
          },
        });
        refresh();
        $q.notify({
          type: "positive",
          message: "Feed updated successfully",
          actions: [{ icon: "close", color: "white" }],
        });
      } catch (err) {
        $q.notify({
          type: "negative",
          message: `Error updating feed: ${err}`,
          actions: [{ icon: "close", color: "white" }],
        });
      }
    },
  );
}
</script>
