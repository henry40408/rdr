<template>
  <q-infinite-scroll ref="infinite-scroll" @load="load">
    <HomeEntryListSpinner v-if="entriesPending" />
    <q-list separator>
      <HomeEntryItem
        v-for="item in store.items"
        :key="item.entry.id"
        :feed="item.feed"
        :entry="item.entry"
        :category="item.category"
      />
    </q-list>
    <template #loading>
      <HomeEntryListSpinner />
    </template>
    <q-banner v-if="!hasMore" class="text-center">
      <q-icon name="info" class="q-mr-sm" />
      No more entries to load.
    </q-banner>
  </q-infinite-scroll>
</template>

<script setup lang="ts">
import type { QInfiniteScroll } from "quasar";

const infiniteScroll = useTemplateRef<QInfiniteScroll>("infinite-scroll");

const store = useEntryStore();
watch(
  () => [store.selectedCategoryId, store.selectedFeedId, store.status],
  () => {
    infiniteScroll.value?.reset();
    infiniteScroll.value?.resume();
  },
);

const entriesPending = computed(() => store.entriesPending);
const hasMore = computed(() => store.hasMore);

async function load(_index: number, done: (stop: boolean) => void) {
  if (!store.hasMore) {
    done(true);
    return;
  }

  await store.loadMore();
  done(!store.hasMore);
}
</script>
