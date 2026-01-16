<template>
  <button
    class="btn"
    :type="type"
    :disabled="disabled || pending"
    :class="{
      normal: variant === 'normal',
      primary: variant === 'primary',
      secondary: variant === 'secondary',
      danger: variant === 'danger',
      revert,
      selected,
    }"
  >
    <span v-if="pending">{{ spinner }}</span>
    <slot v-else />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  disabled?: boolean;
  pending?: boolean;
  revert?: boolean;
  selected?: boolean;
  type?: "button" | "submit" | "reset";
  variant?: "normal" | "primary" | "secondary" | "danger";
}>();

const interval = useInterval(1000);
const spinner = computed(() => {
  const frames = ["...", ":..", ".:.", "..:"];
  const index = Math.floor((interval.value / 250) % frames.length);
  return frames[index];
});
</script>

<style scoped>
@reference "tailwindcss";

.btn {
  @apply bg-gray-300 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1 hover:cursor-pointer;
}
.btn.danger {
  @apply bg-red-500 dark:bg-red-700 hover:bg-red-400 dark:hover:bg-red-600 text-white;
}
.btn.primary {
  @apply bg-blue-500 dark:bg-blue-700 hover:bg-blue-400 dark:hover:bg-blue-600 text-white;
}
.btn.secondary {
  @apply bg-green-500 dark:bg-green-700 hover:bg-green-400 dark:hover:bg-green-600 text-white;
}
.btn.selected {
  @apply bg-green-300 dark:bg-green-800 hover:bg-green-200 dark:hover:bg-green-700;
}
.btn.revert {
  @apply bg-gray-400 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500;
}
</style>
