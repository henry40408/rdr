<template>
  <header>
    <h1>
      <span v-if="listStatus === 'unread'">Unread entries</span>
      <span v-else-if="listStatus === 'read'">Read entries</span>
      <span v-else>All entries</span>
      ({{ countStatus == "success" && countData ? countData.count : "?" }})
    </h1>
    <Nav />
  </header>
  <main>
    <div>
      <ul class="list-status-nav">
        <li>Status</li>
        <li>
          <a href="#" :class="{ active: listStatus === 'unread' }" @click.prevent="listStatus = 'unread'">Unread</a>
        </li>
        <li>
          <a href="#" :class="{ active: listStatus === 'all' }" @click.prevent="listStatus = 'all'">All</a>
        </li>
        <li>
          <a href="#" :class="{ active: listStatus === 'read' }" @click.prevent="listStatus = 'read'">Read</a>
        </li>
      </ul>
      <ul class="list-status-nav">
        <li>Filter</li>
        <li>
          <span v-if="selectedFeedId">
            {{ getFilteredFeedTitle() }}
            <a href="#" @click.prevent="selectedFeedId = null">(unfilter)</a>
          </span>
          <span v-else>All feeds</span>
        </li>
        <li>
          <span v-if="selectedCategoryId">
            {{ getFilteredCategoryName() }}
            <a href="#" @click.prevent="selectedCategoryId = null">(unfilter)</a>
          </span>
          <span v-else>All categories</span>
        </li>
      </ul>
      <ul class="list-status-nav">
        <li>Actions</li>
        <li>
          <a href="#" @click.prevent="markAllAsRead()">&#x2705; Mark all as read</a>
        </li>
      </ul>
    </div>
    <div v-for="(item, index) in allItems" :key="item.entry.guid">
      <h4>
        <EntryCheckbox
          :ref="(el) => setCheckboxRef(index, el)"
          :entryId="item.entry.id"
          :initial="!!item.entry.readAt"
          @toggled="onEntryToggled"
        />
        <span v-if="item.entry.readAt" class="read-title">{{ item.entry.title }}</span>
        <span v-else>{{ item.entry.title }}</span>
        {{ " " }}
        <NuxtLink target="_blank" rel="noopener noreferrer" :to="item.entry.link" @click="markAsRead(index)"
          >&#x2197;</NuxtLink
        >
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
          {{ " " }}
          <a href="#" v-if="!selectedFeedId" @click.prevent="selectedFeedId = item.feed.id">(filter)</a>
          &#x1F4C2;
          <span title="Category">{{ item.feed.category.name }}</span>
          {{ " " }}
          <a href="#" v-if="!selectedCategoryId" @click.prevent="selectedCategoryId = item.feed.category.id"
            >(filter)</a
          >
          {{ " " }}
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
import { useRouteQuery } from "@vueuse/router";

const LIMIT = 100;

/** @type {Ref<import('../server/api/entries.post').EntryEntityWithFeed[]>} */
const allItems = ref([]);

/** @type {Ref<(ComponentPublicInstance|Element)[]>} */
const checkboxRefs = ref([]);

const hasMore = ref(true);
const offset = ref(0);

/** @type {Ref<"all"|"read"|"unread">} */
const listStatus = useRouteQuery("status", "unread");
/** @type {Ref<string|null>} */
const selectedCategoryId = useRouteQuery("categoryId", null);
/** @type {Ref<string|null>} */
const selectedFeedId = useRouteQuery("feedId", null);

const feedIdsForCount = computed(() => {
  if (selectedFeedId.value) return [selectedFeedId.value];
  if (selectedCategoryId.value && categories.value) {
    const feedIds = categories.value.flatMap((c) =>
      c.id === selectedCategoryId.value ? c.feeds.map((f) => f.id) : [],
    );
    if (feedIds.length > 0) return feedIds;
  }
  return undefined;
});

const { data: categories } = await useFetch("/api/categories");
const {
  data: countData,
  status: countStatus,
  execute: refreshCount,
} = await useFetch("/api/count", {
  method: "POST",
  body: {
    feedIds: feedIdsForCount,
    status: listStatus,
  },
});
const { data: imagePks } = await useFetch("/api/feeds/image-pks");

const el = ref(document);
const { reset } = useInfiniteScroll(
  el,
  async () => {
    const body = {};
    if (selectedFeedId.value) {
      body.feedIds = [selectedFeedId.value];
    } else if (selectedCategoryId.value) {
      const feedIds = categories.value?.flatMap((c) =>
        c.id === selectedCategoryId.value ? c.feeds.map((f) => f.id) : [],
      );
      if (feedIds) body.feedIds = feedIds;
    }
    body.limit = LIMIT;
    body.offset = offset.value;
    body.status = listStatus.value;

    const entries = await $fetch("/api/entries", { method: "POST", body });
    if (entries.length < LIMIT) hasMore.value = false;
    for (const entry of entries) allItems.value.push(entry);
    offset.value += entries.length;
  },
  {
    distance: 10,
    canLoadMore: () => hasMore.value,
  },
);
watch([selectedCategoryId, selectedFeedId, listStatus], () => {
  allItems.value = [];
  offset.value = 0;
  hasMore.value = true;
  reset();
});

/**
 * @param {number} index
 */
function markAsRead(index) {
  if (allItems.value[index].entry.readAt) return; // already read

  const checkbox = checkboxRefs.value[index];
  if (checkbox && "$el" in checkbox) checkbox.$el.click();
}

function getFilteredCategoryName() {
  if (!selectedCategoryId.value) return "None";
  if (!categories.value) return "Unknown";
  const entry = categories.value.find((c) => c.id === selectedCategoryId.value);
  return entry ? entry.name : "Unknown";
}

function getFilteredFeedTitle() {
  if (!selectedFeedId.value) return "None";
  if (!categories.value) return "Unknown";
  const entry = categories.value.flatMap((c) => c.feeds).find((f) => f.id === selectedFeedId.value);
  return entry ? entry.title : "Unknown";
}

/**
 * @param {string} feedId
 * @returns {boolean}
 */
function imageExists(feedId) {
  const externalId = buildFeedImageExternalId(feedId);
  return (imagePks && imagePks.value?.includes(externalId)) || false;
}

function markAllAsRead() {
  for (let i = 0; i < allItems.value.length; i += 1) markAsRead(i);
}

/** @param {string} entryId */
function onEntryToggled(entryId) {
  const entry = allItems.value.find((e) => e.entry.id === entryId);
  if (entry) entry.entry.readAt = entry.entry.readAt ? null : new Date().toISOString();
  refreshCount();
}

/**
 * @param {number} index
 * @param {ComponentPublicInstance|Element|null} el
 */
function setCheckboxRef(index, el) {
  if (el) checkboxRefs.value[index] = el;
}
</script>

<style scoped>
.feed-image {
  width: 1rem;
  height: 1rem;
  vertical-align: middle;
  margin-right: 0.25rem;
}

.list-status-nav {
  display: flex;
  gap: 1rem;
  justify-content: center;
  list-style: none;
  padding: 0;
}

.list-status-nav .active::before {
  content: "\2705";
  margin-right: 0.25rem;
}

.read-title {
  opacity: 0.5;
  text-decoration: line-through;
}
</style>
