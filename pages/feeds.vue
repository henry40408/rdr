<template>
  <header>
    <h1>Categories &amp; feeds</h1>
    <Nav />
  </header>
  <main>
    <div>
      <nav class="top-nav">
        <ul>
          <li>Actions</li>
          <li>
            <a href="#" @click="refreshAll()">
              &#x267B;
              {{ refreshingCategoryIds.size > 0 ? "Refreshing..." : "Refresh all" }}
            </a>
          </li>
          <li><a href="/api/opml">&#x1F4E6; Export OPML</a></li>
        </ul>
      </nav>
    </div>
    <template v-for="category in categories" :key="category.id">
      <h2>{{ category.name }} ({{ category.feeds.length }})</h2>
      <div>
        <button @click="refreshCategory(category)" :disabled="refreshingCategoryIds.has(category.id)">
          {{ refreshingCategoryIds.has(category.id) ? "Refreshing..." : "Refresh category" }}
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Feed</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="feed in category.feeds" :key="feed.id">
            <td>
              <div>
                <img
                  v-if="imageExists(feed.id)"
                  :src="`/api/feeds/${feed.id}/image`"
                  alt="Feed Image"
                  class="feed-image"
                />
                <a :href="feed.htmlUrl" target="_blank" rel="noopener noreferrer">{{ feed.title }}</a>
              </div>
              <div>
                <small>{{ feed.xmlUrl }}</small>
              </div>
              <FeedData
                v-if="feedDataByFeedId[feed.id]"
                :count="feedDataByFeedId[feed.id].count"
                :fetched-at="feedDataByFeedId[feed.id].metadata.fetchedAt"
              />
            </td>
            <td>
              <button @click="refreshFeed(feed)" :disabled="refreshingFeedIds.has(feed.id)">
                {{ refreshingFeedIds.has(feed.id) ? "Refreshing..." : "Refresh feed" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </main>
</template>

<script setup>
const { data: categories, execute: refreshCategories } = await useFetch("/api/categories");
const { data: feedData, execute: refreshFeedData } = await useFetch("/api/feed-data");

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

<style scoped>
.feed-image {
  width: 1rem;
  height: 1rem;
  vertical-align: middle;
  margin-right: 0.25rem;
}

.top-nav ul {
  display: flex;
  gap: 1rem;
  justify-content: center;
  list-style: none;
  padding: 0;
}
</style>
