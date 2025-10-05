<template>
  <header>
    <h1>Entries ({{ countData ? countData.count : "..." }})</h1>
    <Nav />
  </header>
  <main>
    <div v-for="item in allItems" :key="item.entry.guid">
      <h4>
        {{ item.entry.title }}
        <NuxtLink :to="item.entry.link" target="_blank" rel="noopener noreferrer">&#x2197;</NuxtLink>
      </h4>
      <div>
        <img
          v-if="imageExists(item.feed.id)"
          :src="`/api/feeds/${item.feed.id}/image`"
          alt="Feed Image"
          class="feed-image"
        />
        <small>
          <span title="Feed">{{ item.feed.title }}</span>
          &#x1F4C2;
          <span title="Category">{{ item.feed.category.name }}</span>
          &#x1F5D3;
          <ClientSideDateTime :datetime="item.entry.date" />
        </small>
      </div>
      <div>
        <EntryContent :entryId="item.entry.id" />
      </div>
    </div>
    <p v-if="hasMore">Loading more...</p>
    <p v-else>No more items.</p>
  </main>
</template>

<script setup>
import { useScroll } from "@vueuse/core";

const limit = 100;

/** @type {Ref<import('../server/api/entries.get').PartialEntryWithFeed[]>} */
const allItems = ref([]);

const offset = ref(0);
const hasMore = ref(true);

const { data: countData } = await useFetch("/api/count");
const { data: imagePks } = await useFetch("/api/feeds/image-pks");

/** @param {import('../server/api/entries.get').PartialEntryWithFeed[]} newItems */
function appendItems(newItems) {
  allItems.value.push(...newItems);
  if (newItems.length < limit) hasMore.value = false;
  offset.value += newItems.length;
}

/**
 * @param {string} feedId
 * @returns {boolean}
 */
function imageExists(feedId) {
  const externalId = buildFeedImageExternalId(feedId);
  return (imagePks && imagePks.value?.includes(externalId)) || false;
}

// render the first page on the server side
const { data: items } = await useFetch("/api/entries", {
  params: { offset: offset.value, limit },
});
if (items.value) appendItems(items.value);

// load more pages on the client side
async function loadMore() {
  if (!hasMore.value) return;

  const query = { offset: offset.value, limit };
  const data = await $fetch("/api/entries", { query, responseType: "json" });
  if (data.length > 0) appendItems(data);
}
const { arrivedState } = useScroll(document, { throttle: 100 });
watch(arrivedState, (v) => {
  if (v.bottom) loadMore();
});
</script>

<style scoped>
.feed-image {
  width: 1rem;
  height: 1rem;
  vertical-align: middle;
  margin-right: 0.25rem;
}
</style>
