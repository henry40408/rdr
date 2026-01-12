<template>
  <div class="space-x-4">
    <input id="showEmpty" v-model="localSettings.showEmpty" type="checkbox" />
    <label for="showEmpty">Show Empty</label>
  </div>
  <select id="categoriesSort" v-model="localSettings.categoriesSort" class="border p-2 w-full border-gray-500">
    <option value="unread_desc">Unread Count (descending)</option>
    <option value="unread_asc">Unread Count (ascending)</option>
    <option value="name_asc">Name (ascending)</option>
    <option value="name_desc">Name (descending)</option>
  </select>
</template>

<script setup lang="ts">
const localSettings = useLocalSettings();
</script>
