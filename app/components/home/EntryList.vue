<template>
  <q-infinite-scroll ref="list" @load="load">
    <q-list separator>
      <HomeEntryItem
        v-for="item in items"
        :key="item.entry.id"
        :feed="item.feed"
        :entry="item.entry"
        :category="item.category"
      />
    </q-list>
    <template #loading>
      <div class="text-center">
        <q-spinner size="md" />
      </div>
    </template>
    <template v-if="!hasMore && items.length === 0">
      <q-banner class="bg-transparent text-center">
        <q-icon name="info" class="q-mr-sm" />
        No entries to display.
      </q-banner>
    </template>
    <template v-if="!hasMore && items.length > 0">
      <q-banner class="bg-transparent text-center">
        <q-icon class="q-mr-sm" name="check_circle" />
        You've reached the end of the list.
      </q-banner>
    </template>
  </q-infinite-scroll>
</template>

<script setup lang="ts">
import type { QInfiniteScroll } from "quasar";

const { entryStatus, hasMore, selectedCategoryId, selectedFeedId } = useEntryState();
const { items, loadMore, pending } = useEntries();

const listRef = useTemplateRef<QInfiniteScroll>("list");
watch([selectedCategoryId, selectedFeedId, entryStatus], () => {
  listRef.value?.reset();
  listRef.value?.resume();
});

async function load(_index: number, done: (stop: boolean) => void) {
  if (!hasMore.value) {
    done(true);
    return;
  }

  loadMore();
  const unwatch = watch(
    pending,
    (newPending) => {
      if (newPending) return;
      done(!hasMore.value);
      unwatch();
    },
    { immediate: true },
  );
}
</script>
