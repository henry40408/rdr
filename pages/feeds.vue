<template>
  <q-layout view="hhh LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>rdr</q-toolbar-title>
      </q-toolbar>
      <Nav />
    </q-header>

    <q-page-container>
      <q-banner inline-actions>
        <div class="text-h6">Feeds</div>
        <template v-slot:action>
          <q-btn flat round icon="refresh" @click="refreshAll" :disable="refreshingCategoryIds.size > 0">
            <q-tooltip anchor="center left" self="center right">Refresh all</q-tooltip>
          </q-btn>
        </template>
      </q-banner>
      <q-list class="q-mb-md">
        <template v-for="category in categories" :key="category.id">
          <q-item>
            <q-item-section>
              <q-item-label>{{ category.name }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label caption>{{ category.feeds.length }} feeds</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                dense
                flat
                round
                icon="visibility"
                @click="() => $router.push({ path: '/', query: { categoryId: category.id } })"
              >
                <q-tooltip anchor="center left" self="center right">Go to category</q-tooltip>
              </q-btn>
            </q-item-section>
            <q-item-section side>
              <q-btn
                dense
                flat
                round
                icon="refresh"
                :loading="refreshingCategoryIds.has(category.id)"
                @click="refreshCategory(category)"
              >
                <q-tooltip anchor="center left" self="center right">Refresh category</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
          <q-separator />
          <q-list>
            <q-item v-for="feed in category.feeds" :key="feed.id">
              <q-item-section avatar>
                <q-avatar v-if="imageExists(feed.id)" size="sm">
                  <img :src="`/api/feeds/${feed.id}/image`" alt="Feed Image" />
                </q-avatar>
                <q-icon v-else name="rss_feed" class="feed-image" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ feed.title }}</q-item-label>
                <q-item-label caption>{{ feedDataByFeedId[feed.id]?.count ?? 0 }} entries</q-item-label>
                <q-item-label caption v-if="feedDataByFeedId[feed.id]?.metadata.fetchedAt">
                  Last fetched: <ClientSideDateTime :datetime="feedDataByFeedId[feed.id].metadata.fetchedAt" />
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn dense flat round icon="open_in_new" :href="feed.htmlUrl" target="_blank" rel="noopener">
                  <q-tooltip anchor="center left" self="center right">Open website</q-tooltip>
                </q-btn>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  dense
                  flat
                  round
                  icon="visibility"
                  @click="() => $router.push({ path: '/', query: { feedId: feed.id } })"
                >
                  <q-tooltip anchor="center left" self="center right">Go to feed</q-tooltip>
                </q-btn>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  dense
                  flat
                  round
                  icon="refresh"
                  :loading="refreshingFeedIds.has(feed.id)"
                  @click.stop="refreshFeed(feed)"
                >
                  <q-tooltip anchor="center left" self="center right">Refresh feed</q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>
        </template>
      </q-list>
    </q-page-container>
  </q-layout>
</template>

<script setup>
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
