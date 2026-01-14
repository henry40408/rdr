<template>
  <div class="content">
    <MarkedText :text="text" :keyword="keyword" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  text: string;
  keyword?: string;
}>();
</script>

<style scoped>
@reference "tailwindcss";

.content :deep(a) {
  @apply underline;
}
.content :deep(blockquote) {
  @apply border-l-4 pl-4 italic my-2 border-gray-400 dark:border-gray-600;
}
.content :deep(code) {
  @apply bg-gray-200 dark:bg-gray-800 px-1 rounded;
}
.content :deep(figure) {
  @apply my-4;
}
.content :deep(figcaption) {
  @apply text-sm text-gray-600 dark:text-gray-400;
}
.content :deep(h1),
.content :deep(h2),
.content :deep(h3) {
  @apply font-bold mt-4 mb-2;
}
.content :deep(hr) {
  @apply my-4 border-t dark:border-gray-600;
}
.content :deep(img) {
  @apply max-w-full h-auto mb-2 dark:bg-gray-800;
}
.content :deep(ul li) {
  @apply list-disc list-inside mb-1;
}
.content :deep(ol li) {
  @apply list-decimal list-inside mb-1;
}
.content :deep(p) {
  @apply mb-2;
}
.content :deep(pre) {
  @apply p-2 overflow-x-auto bg-gray-200 dark:bg-gray-800;
}
.content :deep(table) {
  @apply mb-4;
}
</style>
