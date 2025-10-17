<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <span v-if="isHtml" v-html="processed" />
  <span v-else>{{ processed }}</span>
</template>

<script setup>
import pangu from "pangu";

const props = defineProps({
  isHtml: { type: Boolean, default: false },
  keyword: { type: String, default: null },
  text: { type: String, required: true },
});

const processed = computed(() => {
  if (!props.keyword) return pangu.spacingText(props.text);

  const regex = new RegExp(`(${props.keyword})`, "gi");
  return props.text.replace(regex, "<mark>$1</mark>");
});
</script>
