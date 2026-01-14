<script setup lang="ts">
defineProps<{
  selected?: boolean;
  revert?: boolean;
  disabled?: boolean;
}>();
</script>

<template>
  <button
    :disabled="disabled"
    class="bg-gray-300 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1 hover:cursor-pointer"
    :class="{
      'bg-green-300 dark:bg-green-800 hover:bg-green-200 dark:hover:bg-green-700': selected,
      'bg-gray-400 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500': revert,
    }"
  >
    <slot />
  </button>
</template>
