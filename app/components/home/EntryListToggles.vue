<template>
  <div>
    <button
      :class="{ 'font-bold bg-green-400 dark:bg-green-600': store.status === 'unread' }"
      class="px-3 py-1 bg-gray-300 dark:bg-gray-700 hover:bg-green-400 dark:hover:bg-green-600 hover:cursor-pointer"
      @click="store.setStatus('unread')"
    >
      Unread
    </button>
    <button
      :class="{ 'font-bold bg-green-400 dark:bg-green-600': store.status === 'all' }"
      class="px-3 py-1 bg-gray-300 dark:bg-gray-700 hover:bg-green-400 dark:hover:bg-green-600 hover:cursor-pointer"
      @click="store.setStatus('all')"
    >
      All
    </button>
    <button
      :class="{ 'font-bold bg-green-400 dark:bg-green-600': store.status === 'read' }"
      class="px-3 py-1 bg-gray-300 dark:bg-gray-700 hover:bg-green-400 dark:hover:bg-green-600 hover:cursor-pointer"
      @click="store.setStatus('read')"
    >
      Read
    </button>
    <button
      :class="{ 'font-bold bg-green-400 dark:bg-green-600': store.status === 'starred' }"
      class="px-3 py-1 bg-gray-300 dark:bg-gray-700 hover:bg-green-400 dark:hover:bg-green-600"
      @click="store.setStatus('starred')"
    >
      Starred
    </button>
  </div>
</template>

<script setup lang="ts">
const store = useEntryStore();
</script>
