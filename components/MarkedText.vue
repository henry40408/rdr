<template>
  <span v-if="keyword" v-html="text.replace(new RegExp(`(${keyword})`, 'gi'), '<mark>$1</mark>')"></span>
  <span v-else-if="isHtml" v-html="text"></span>
  <span v-else>{{ text }}</span>
</template>

<script setup>
defineProps({
  isHtml: { type: Boolean, default: false },
  keyword: { type: String },
  text: { type: String, required: true },
});
</script>
