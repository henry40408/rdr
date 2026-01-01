<template>
  <time :title="formatted" :datetime="formatted">{{ formatted }}</time>
</template>

<script setup lang="ts">
const props = defineProps<{
  datetime: string;
}>();

const formatted = new Date(props.datetime).toLocaleString();
</script>
