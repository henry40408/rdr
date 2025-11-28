<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <span v-html="processed" />
</template>

<script setup lang="ts">
const props = defineProps({
  keyword: { type: String, default: null },
  text: { type: String, required: true },
});

const processed = computed(() => {
  if (!props.keyword) return props.text;
  return highlightKeyword(props.text, props.keyword);
});
</script>
