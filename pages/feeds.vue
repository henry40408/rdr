<template>
  <header>
    <h1>Categories &amp; feeds</h1>
    <Nav />
  </header>
  <main>
    <div>
      <h3>Actions</h3>
      <button @click="refreshAll" :disabled="refreshingCategoryIds.size > 0">
        {{ refreshingCategoryIds.size > 0 ? "Refreshing..." : "Refresh all" }}
      </button>
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
                <div>
                  <small>{{ feed.xmlUrl }}</small>
                </div>
                <FeedMetadata :metadata="findMetadataByFeed(feed)" />
              </div>
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
const { data: imagePks, execute: refreshImages } = await useFetch("/api/feeds/image-pks");
const { data: feedMetadata, execute: refreshFeedMetadata } = await useFetch("/api/feed-metadata-list");

/** @type {Ref<Set<string>>} */
const refreshingCategoryIds = ref(new Set());
/** @type {Ref<Set<string>>} */
const refreshingFeedIds = ref(new Set());

async function refreshAll() {
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

async function afterRefresh() {
  await Promise.all([refreshCategories(), refreshFeedMetadata(), refreshImages()]);
}

/**
 * @param {FeedEntity} feed
 * @returns {FeedMetadataEntity|undefined}
 */
function findMetadataByFeed(feed) {
  return feedMetadata.value?.find((m) => m.feedId === feed.id);
}

/**
 * @param {string} feedId
 * @returns {boolean}
 */
function imageExists(feedId) {
  const externalId = buildFeedImageExternalId(feedId);
  return (imagePks && imagePks.value?.includes(externalId)) || false;
}
</script>

<style scoped>
.feed-image {
  width: 1rem;
  height: 1rem;
  vertical-align: middle;
  margin-right: 0.25rem;
}
</style>
