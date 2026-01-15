<template>
  <div class="space-x-2">
    <input id="showErrorFeeds" v-model="store.showErrorOnly" type="checkbox" />
    <label for="showErrorFeeds">Show Error Feeds Only</label>
  </div>
</template>

<script setup lang="ts">
const store = useCategoryStore();
</script>
