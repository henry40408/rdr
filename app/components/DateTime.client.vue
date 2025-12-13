<template>
  <time :datetime="parsed.toISOString()">{{ parsed.toLocaleString() }}</time>
</template>

<script setup lang="ts">
const props = defineProps<{
  date: string;
}>();

const parsed = computed(() => new Date(props.date));
</script>
