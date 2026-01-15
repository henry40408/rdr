<template>
  <button class="btn" :type="type" :disabled="disabled" :class="{ selected, revert }">
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  selected?: boolean;
  revert?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}>();
</script>

<style scoped>
@reference "tailwindcss";

.btn {
  @apply bg-gray-300 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1 hover:cursor-pointer;
}
.btn.selected {
  @apply bg-green-300 dark:bg-green-800 hover:bg-green-200 dark:hover:bg-green-700;
}
.btn.revert {
  @apply bg-gray-400 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500;
}
</style>
