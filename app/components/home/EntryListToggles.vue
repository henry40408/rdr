<template>
  <div>
    <button
      class="x-button px-3 py-1 hover:cursor-pointer"
      :class="{ 'x-selected font-bold': store.status === 'unread' }"
      @click="store.setStatus('unread')"
    >
      Unread
    </button>
    <button
      class="x-button px-3 py-1 hover:cursor-pointer"
      :class="{ 'x-selected font-bold': store.status === 'all' }"
      @click="store.setStatus('all')"
    >
      All
    </button>
    <button
      class="x-button px-3 py-1 hover:cursor-pointer"
      :class="{ 'x-selected font-bold': store.status === 'read' }"
      @click="store.setStatus('read')"
    >
      Read
    </button>
    <button
      class="x-button px-3 py-1 hover:cursor-pointer"
      :class="{ 'x-selected font-bold': store.status === 'starred' }"
      @click="store.setStatus('starred')"
    >
      Starred
    </button>
  </div>
  <div class="md:flex">
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
</script>

<style scope>
@reference "tailwindcss";

.x-button {
  @apply bg-gray-300 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700;
}

.x-selected {
  @apply bg-green-300 dark:bg-green-800;
}
</style>
