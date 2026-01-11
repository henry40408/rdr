<template>
  <div class="space-x-4">
    <input id="showEmpty" v-model="localSettings.showEmpty" type="checkbox" />
    <label for="showEmpty">Show Empty</label>
  </div>
</template>

<script setup lang="ts">
const localSettings = useLocalSettings();
</script>
