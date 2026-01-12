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
</template>

<script setup lang="ts">
const store = useEntryStore();
</script>

<style scope>
@reference "tailwindcss";

.x-button {
  @apply bg-gray-300 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700;
}

.x-selected {
  @apply bg-green-300 dark:bg-green-800;
}
</style>
