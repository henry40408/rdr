<template>
  <a :href="href" target="_blank" rel="noopener noreferrer">
    <slot />
    &nearr;
  </a>
</template>

<script setup lang="ts">
defineProps<{ href: string }>();
</script>

<style scoped>
@reference "tailwindcss";
a {
  @apply text-blue-600 dark:text-blue-400 hover:underline;
}
</style>
