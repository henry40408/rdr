<template>
  <div>
    <button
      :class="{ 'font-bold': store.status === 'unread' }"
      class="px-3 py-1 hover:cursor-pointer"
      @click="store.setStatus('unread')"
    >
      Unread
    </button>
    <button
      :class="{ 'font-bold': store.status === 'all' }"
      class="px-3 py-1 hover:cursor-pointer"
      @click="store.setStatus('all')"
    >
      All
    </button>
    <button
      :class="{ 'font-bold': store.status === 'read' }"
      class="px-3 py-1 hover:cursor-pointer"
      @click="store.setStatus('read')"
    >
      Read
    </button>
    <button :class="{ 'font-bold': store.status === 'starred' }" class="px-3 py-1" @click="store.setStatus('starred')">
      Starred
    </button>
  </div>
</template>

<script setup lang="ts">
const store = useEntryStore();
</script>
