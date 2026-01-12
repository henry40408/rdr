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
  @apply hover:underline;
}
</style>
