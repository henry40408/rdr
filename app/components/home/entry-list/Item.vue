<template>
  <div class="p-2">{{ entry.title }}</div>
</template>

<script setup lang="ts">
defineProps<{
  entry: {
    id: number;
    title: string;
  };
}>();
</script>
