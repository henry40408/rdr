<template>
  <a :href="href" target="_blank" rel="noopener noreferrer">
    <slot />
    <q-icon size="xs" class="q-ml-sm" name="open_in_new" />
  </a>
</template>

<script setup lang="ts">
defineProps<{
  href: string;
}>();
</script>
