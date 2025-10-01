<template>
  <h1>Categories &amp; feeds</h1>
  <Nav />
  <template v-for="category in categories" :key="category.id">
    <h2>{{ category.name }}</h2>
    <div>
      <RefreshCategory :categoryId="category.id" @refreshed="refreshAll()" />
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
            <RefreshFeed :feedId="feed.id" @refreshed="refreshAll()" />
          </td>
        </tr>
      </tbody>
    </table>
  </template>
</template>

<script setup>
const { data: categories, execute: refreshCategories } = await useFetch("/api/categories");
const { data: imagePks, execute: refreshImages } = await useFetch("/api/feeds/image-pks");
const { data: feedMetadata, execute: refreshFeedMetadata } = await useFetch("/api/feed-metadata-list");

/**
 * @param {import('../server/utils/entities').FeedEntity} feed
 * @returns {import('../server/utils/entities').FeedMetadataEntity|null}
 */
function findMetadataByFeed(feed) {
  return feedMetadata.value?.find((m) => m.feedId === feed.id) || null;
}

async function refreshAll() {
  await refreshCategories();
  await refreshImages();
  await refreshFeedMetadata();
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
