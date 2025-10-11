<template>
  <q-layout view="hhh LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          <q-avatar>
            <q-icon name="rss_feed" />
          </q-avatar>
          rdr
        </q-toolbar-title>
      </q-toolbar>
      <NavTabs />
    </q-header>

    <q-page-container>
      <q-page>
        <q-list padding>
          <q-item>
            <q-item-section header>
              <q-item-label class="text-h5">Feeds</q-item-label>
              <q-item-label caption>Manage your feed subscriptions</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn flat round icon="refresh" :disable="refreshingCategoryIds.size > 0" @click="refreshAll">
                <q-tooltip self="center right" anchor="center left">Refresh all</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-toggle v-model="hideEmpty" label="Hide empty" />
            </q-item-section>
          </q-item>
          <template v-for="category in categories" :key="category.id">
            <template v-if="!hideEmpty || categoryUnreadCount(category.id) > 0">
              <q-expansion-item group="category">
                <template #header>
                  <q-item-section
                    v-ripple
                    clickable
                    @click="() => $router.push({ path: '/', query: { categoryId: category.id } })"
                  >
                    <q-item-label class="text-h6">{{ category.name }}</q-item-label>
                  </q-item-section>
                  <q-item-section top side>
                    <q-item-label caption>{{ category.feeds.length }} feeds</q-item-label>
                    <div class="q-mt-xs">
                      <q-badge color="primary" :outline="!categoryUnreadCount(category.id)">{{
                        categoryUnreadCount(category.id)
                      }}</q-badge>
                    </div>
                  </q-item-section>
                </template>

                <q-card>
                  <q-card-section class="row items-center q-gutter-sm">
                    <q-btn
                      size="sm"
                      icon="refresh"
                      color="primary"
                      label="Refresh"
                      :loading="refreshingCategoryIds.has(category.id)"
                      @click="refreshCategory(category)"
                    />
                  </q-card-section>
                </q-card>
              </q-expansion-item>
              <q-list separator>
                <template v-for="feed in category.feeds" :key="feed.id">
                  <q-expansion-item
                    v-if="!hideEmpty || feedUnreadCount(feed.id) > 0"
                    expand-icon-toggle
                    :group="`category-${category.id}`"
                  >
                    <template #header>
                      <q-item-section side>
                        <q-avatar v-if="imageExists(feed.id)" square size="xs">
                          <!-- prettier-ignore -->
                          <img alt="Feed Image" :src="`/api/images/${buildFeedImageKey(feed.id)}`">
                        </q-avatar>
                        <q-icon v-else name="rss_feed" class="feed-image" />
                      </q-item-section>
                      <q-item-section
                        v-ripple
                        clickable
                        @click="() => $router.push({ path: '/', query: { feedId: feed.id } })"
                      >
                        <q-item-label lines="1">
                          {{ feed.title }}
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <div class="q-mt-xs">
                          <q-badge color="primary" :outline="!feedUnreadCount(feed.id)">{{
                            feedUnreadCount(feed.id)
                          }}</q-badge>
                        </div>
                      </q-item-section>
                    </template>

                    <q-card>
                      <q-card-section class="row items-center q-gutter-sm">
                        <q-btn
                          size="sm"
                          icon="refresh"
                          color="primary"
                          label="Refresh"
                          :loading="refreshingFeedIds.has(feed.id)"
                          @click="refreshFeed(feed)"
                        />
                        <div class="text-caption">
                          {{ formatFetchedAtToNow(feed.id) }}
                        </div>
                        <q-btn
                          flat
                          size="sm"
                          color="primary"
                          target="_blank"
                          icon="open_in_new"
                          :href="feed.htmlUrl"
                          label="Go to website"
                          rel="noopener noreferrer"
                        />
                      </q-card-section>
                    </q-card>
                  </q-expansion-item>
                </template>
              </q-list>
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
        </q-list>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { formatDistanceToNow } from "date-fns";
import { useQuasar } from "quasar";
import { useLocalSettings } from "./local-settings";

const $q = useQuasar();
const { hideEmpty } = useLocalSettings();

const { data: categories, execute: refreshCategories } = await useFetch("/api/categories");
const { data: feedData, execute: refreshFeedData } = await useFetch("/api/feeds/data");

const feedDataByFeedId = computed(() => feedData.value?.feeds || {});

/** @type {Ref<Set<number>>} */
const refreshingCategoryIds = ref(new Set());
/** @type {Ref<Set<number>>} */
const refreshingFeedIds = ref(new Set());

async function afterRefresh() {
  await Promise.all([refreshCategories(), refreshFeedData()]);
}

/**
 * @param {number} categoryId
 * @returns {number}
 */
function categoryUnreadCount(categoryId) {
  const category = categories.value?.find((c) => c.id === categoryId);
  if (!category) return 0;
  return category.feeds.reduce((sum, feed) => {
    const feedData = feedDataByFeedId.value[feed.id];
    return sum + (feedData?.unreadCount || 0);
  }, 0);
}

/**
 * @param {number} feedId
 * @returns {number}
 */
function feedUnreadCount(feedId) {
  return feedDataByFeedId.value[feedId]?.unreadCount || 0;
}

/**
 * @param {number} feedId
 * @returns {string}
 */
function formatFetchedAtToNow(feedId) {
  const fetchedAt = feedData.value?.feeds[feedId]?.fetchedAt;
  if (!fetchedAt) return "never";
  return formatDistanceToNow(new Date(fetchedAt), { addSuffix: true });
}

/**
 * @param {number} feedId
 * @returns {boolean}
 */
function imageExists(feedId) {
  return feedData.value?.feeds[feedId]?.imageExists || false;
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
    for (const feedId of feedIds) tasks.push($fetch(`/api/feeds/${feedId}/refresh`, { method: "POST" }));
    await Promise.all(tasks);
    await afterRefresh();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Error refreshing category ${category.name}: ${err}`,
      progress: true,
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
    await $fetch(`/api/feeds/${feed.id}/refresh`, { method: "POST" });
    await afterRefresh();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Error refreshing feed ${feed.title}: ${err}`,
      progress: true,
      actions: [{ icon: "close", color: "white" }],
    });
  } finally {
    refreshingFeedIds.value.delete(feed.id);
  }
}
</script>
