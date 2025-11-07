<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <span v-html="processed" />
</template>

<script setup lang="ts">
import pangu from "pangu";

const props = defineProps({
  keyword: { type: String, default: null },
  text: { type: String, required: true },
});

const processed = computed(() => {
  if (!props.keyword) return pangu.spacingText(props.text);

  const regex = new RegExp(`(${props.keyword})`, "gi");
  return props.text.replace(regex, "<mark>$1</mark>");
});
</script>
