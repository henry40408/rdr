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
      <nav class="list-status-nav">
        <ul>
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
      </nav>
    </div>
    <div v-for="item in allItems" :key="item.entry.guid">
      <h4>
        <EntryCheckbox :entryId="item.entry.id" :initial="!!item.entry.readAt" @toggled="onEntryToggled" />
        <span v-if="item.entry.readAt" class="read-title">{{ item.entry.title }}</span>
        <span v-else>{{ item.entry.title }}</span>
        &nbsp;
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
const limit = 100;

/** @type {Ref<import('../server/api/entries.get').PartialEntryWithFeed[]>} */
const allItems = ref([]);

const hasMore = ref(true);
const offset = ref(0);

/** @type {Ref<"all"|"read"|"unread">} */
const listStatus = ref("unread");

const { data: countData, status: countStatus } = await useFetch("/api/count", {
  query: { status: listStatus },
});
const { data: imagePks } = await useFetch("/api/feeds/image-pks");

const el = ref(document);
const { reset } = useInfiniteScroll(
  el,
  async () => {
    const entries = await $fetch("/api/entries", {
      params: {
        limit,
        offset: offset.value,
        status: listStatus.value,
      },
      responseType: "json",
    });
    if (entries.length < limit) hasMore.value = false;
    for (const entry of entries) allItems.value.push(entry);
    offset.value += entries.length;
  },
  {
    distance: 10,
    canLoadMore: () => hasMore.value,
  },
);
watch(listStatus, () => {
  allItems.value = [];
  offset.value = 0;
  hasMore.value = true;
  reset();
});

/**
 * @param {string} feedId
 * @returns {boolean}
 */
function imageExists(feedId) {
  const externalId = buildFeedImageExternalId(feedId);
  return (imagePks && imagePks.value?.includes(externalId)) || false;
}

/** @param {string} entryId */
function onEntryToggled(entryId) {
  const entry = allItems.value.find((e) => e.entry.id === entryId);
  if (entry) entry.entry.readAt = entry.entry.readAt ? null : new Date().toISOString();
}
</script>

<style scoped>
.feed-image {
  width: 1rem;
  height: 1rem;
  vertical-align: middle;
  margin-right: 0.25rem;
}

.list-status-nav ul {
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
