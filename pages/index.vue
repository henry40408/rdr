<template>
  <h1>Entries ({{ countData?.count || "..." }})</h1>
  <Nav />
  <div v-for="item in allItems" :key="item.entry.guid">
    <h4>
      {{ item.entry.title }}
      <NuxtLink :to="item.entry.link" target="_blank" rel="noopener noreferrer">&#x1F5D7;</NuxtLink>
    </h4>
    <div>
      <small>{{ item.feed.title }}, <ClientSideDateTime :datetime="item.entry.date" /></small>
    </div>
  </div>
  <p v-if="hasMore">Loading more...</p>
  <p v-else>No more items.</p>
</template>

<script setup>
import { useScroll } from "@vueuse/core";

const limit = 100;

/** @type {Ref<import('../server/api/entries.get').PartialEntryWithFeed[]>} */
const allItems = ref([]);

const offset = ref(0);
const hasMore = ref(true);

const { data: countData } = await useFetch("/api/count");

/** @param {import('../server/api/entries.get').PartialEntryWithFeed[]} newItems */
function appendItems(newItems) {
  allItems.value.push(...newItems);
  if (newItems.length < limit) hasMore.value = false;
  offset.value += newItems.length;
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
