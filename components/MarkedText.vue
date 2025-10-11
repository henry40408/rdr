<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <span v-if="keyword" v-html="text.replace(new RegExp(`(${keyword})`, 'gi'), '<mark>$1</mark>')" />
  <!-- eslint-disable-next-line vue/no-v-html -->
  <span v-else-if="isHtml" v-html="text" />
  <span v-else>{{ text }}</span>
</template>

<script setup>
defineProps({
  isHtml: { type: Boolean, default: false },
  keyword: { type: String, default: null },
  text: { type: String, required: true },
});
</script>
