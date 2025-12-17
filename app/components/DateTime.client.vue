<template>
  <time :title="formatted" :datetime="formatted">{{ formatted }}</time>
</template>

<script setup lang="ts">
const props = defineProps<{
  date: string;
}>();

const formatted = computed(() => new Date(props.date).toLocaleString());
</script>
