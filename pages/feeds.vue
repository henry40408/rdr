<template>
  <q-layout view="hhh LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>rdr</q-toolbar-title>
      </q-toolbar>
      <Nav />
    </q-header>

    <q-page-container>
      <q-page>
        <q-banner inline-actions>
          <div class="text-h6">Feeds</div>
          <template v-slot:action>
            <q-btn flat round icon="refresh" @click="refreshAll" :disable="refreshingCategoryIds.size > 0">
              <q-tooltip anchor="center left" self="center right">Refresh all</q-tooltip>
            </q-btn>
          </template>
        </q-banner>
        <q-list>
          <template v-for="category in categories" :key="category.id">
            <q-expansion-item group="category">
              <template v-slot:header>
                <q-item-section
                  clickable
                  v-ripple
                  @click="() => $router.push({ path: '/', query: { categoryId: category.id } })"
                >
                  <q-item-label>{{ category.name }}</q-item-label>
                </q-item-section>
                <q-item-section side top>
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
                    @click="refreshCategory(category)"
                    :loading="refreshingCategoryIds.has(category.id)"
                    icon="refresh"
                    color="primary"
                    label="Refresh"
                    size="sm"
                  />
                </q-card-section>
              </q-card>
            </q-expansion-item>
            <q-list separator>
              <q-expansion-item
                :group="`category-${category.id}`"
                v-for="feed in category.feeds"
                expand-icon-toggle
                :key="feed.id"
              >
                <template v-slot:header>
                  <q-item-section side>
                    <q-avatar square v-if="imageExists(feed.id)" size="xs">
                      <img :src="`/api/feeds/${feed.id}/image`" alt="Feed Image" />
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
                      @click="refreshFeed(feed)"
                      :loading="refreshingFeedIds.has(feed.id)"
                      icon="refresh"
                      color="primary"
                      label="Refresh"
                      size="sm"
                    />
                    <div class="text-caption">
                      {{ formatFetchedAtToNow(feed.id) }}
                    </div>
                    <q-btn
                      size="sm"
                      flat
                      icon="open_in_new"
                      color="primary"
                      label="Go to website"
                      :href="feed.htmlUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  </q-card-section>
                </q-card>
              </q-expansion-item>
            </q-list>
          </template>
        </q-list>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { formatDistanceToNow } from "date-fns";

const { data: categories, execute: refreshCategories } = await useFetch("/api/categories");
const { data: feedData, execute: refreshFeedData } = await useFetch("/api/feeds/data");

const feedDataByFeedId = computed(() => feedData.value?.feeds || {});

/** @type {Ref<Set<string>>} */
const refreshingCategoryIds = ref(new Set());
/** @type {Ref<Set<string>>} */
const refreshingFeedIds = ref(new Set());

async function afterRefresh() {
  await Promise.all([refreshCategories(), refreshFeedData()]);
}

/**
 * @param {string} categoryId
 * @returns {number}
 */
function categoryUnreadCount(categoryId) {
  const category = categories.value?.find((cat) => cat.id === categoryId);
  if (!category) return 0;
  return category.feeds.reduce((sum, feed) => {
    const feedData = feedDataByFeedId.value[feed.id];
    return sum + (feedData?.unreadCount || 0);
  }, 0);
}

/**
 * @param {string} feedId
 * @returns {number}
 */
function feedUnreadCount(feedId) {
  return feedDataByFeedId.value[feedId]?.unreadCount || 0;
}

/**
 * @param {string} feedId
 * @returns {string}
 */
function formatFetchedAtToNow(feedId) {
  const fetchedAt = feedData.value?.feeds[feedId]?.metadata.fetchedAt;
  if (!fetchedAt) return "never";
  return formatDistanceToNow(new Date(fetchedAt), { addSuffix: true });
}

/**
 * @param {string} feedId
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
    await Promise.allSettled(tasks);
    await afterRefresh();
  } catch (err) {
    console.error("Error refreshing category:", err);
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
    console.error("Error refreshing feed:", err);
  } finally {
    refreshingFeedIds.value.delete(feed.id);
  }
}
</script>
