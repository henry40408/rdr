<template>
  <div class="space-y-2 md:space-x-2 md:flex md:space-y-0 text-sm md:text-base">
    <div class="space-x-2">
      <button class="x-button" @click.prevent="store.load()">{{ store.pending ? "..." : "Refresh" }}</button>
      <input v-model="search" type="text" placeholder="search..." class="bg-gray-300 dark:bg-gray-800 p-1" />
    </div>
    <div>
      <button
        class="x-button"
        :class="{ 'x-selected font-bold': store.status === 'unread' }"
        @click="store.setStatus('unread')"
      >
        Unread
      </button>
      <button
        class="x-button"
        :class="{ 'x-selected font-bold': store.status === 'all' }"
        @click="store.setStatus('all')"
      >
        All
      </button>
      <button
        class="x-button"
        :class="{ 'x-selected font-bold': store.status === 'read' }"
        @click="store.setStatus('read')"
      >
        Read
      </button>
      <button
        class="x-button"
        :class="{ 'x-selected font-bold': store.status === 'starred' }"
        @click="store.setStatus('starred')"
      >
        Starred
      </button>
    </div>
  </div>
  <div class="md:flex text-sm md:text-base">
    <div v-if="store.selectedCategory" class="p-2 x-button">
      {{ store.selectedCategory.name }}
      <a href="#" @click.prevent="store.setCategory(undefined)">clear</a>
    </div>
    <div v-if="store.selectedFeed" class="p-2 x-button">
      {{ store.selectedFeed.title }}
      <a href="#" @click.prevent="store.setFeed(undefined, store.selectedFeed.categoryId)">clear</a>
    </div>
  </div>
</template>

<script setup lang="ts">
const store = useEntryStore();

const search = ref(store.search);
const debouncedSearch = debouncedRef(search, 750);
watch(debouncedSearch, (newSearch) => {
  store.setSearch(newSearch);
});
</script>
