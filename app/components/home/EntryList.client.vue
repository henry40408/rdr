<template>
  <q-pull-to-refresh @refresh="pullToRefresh">
    <q-infinite-scroll ref="infinite-scroll" @load="load">
      <HomeEntryListSpinner v-if="store.entriesPending" />
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
      <q-banner v-if="!store.hasMore" class="text-center">
        <q-icon name="info" class="q-mr-sm" />
        No more entries to load.
      </q-banner>
    </q-infinite-scroll>
  </q-pull-to-refresh>
</template>

<script setup lang="ts">
import type { QInfiniteScroll } from "quasar";

const infiniteScroll = useTemplateRef<QInfiniteScroll>("infinite-scroll");

function resetInfiniteScroll() {
  infiniteScroll.value?.reset();
  infiniteScroll.value?.resume();
}

const store = useEntryStore();
watch([() => store.selectedCategoryId, () => store.selectedFeedId, () => store.status], () => {
  resetInfiniteScroll();
});

async function load(_index: number, done: (stop: boolean) => void) {
  if (!store.hasMore) {
    done(true);
    return;
  }

  await store.loadMore();
  done(!store.hasMore);
}

async function pullToRefresh(done: () => void) {
  resetInfiniteScroll();
  store.reset();
  await store.load();
  done();
}
</script>
