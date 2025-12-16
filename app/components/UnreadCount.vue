<template>
  <q-badge color="primary" :outline="isZero">{{ countLabel }}</q-badge>
</template>

<script setup lang="ts">
const props = defineProps<{
  count: number;
}>();

const countLabel = computed(() => {
  if (props.count > 999) return "999+";
  return String(props.count);
});
const isZero = computed(() => props.count === 0);
</script>
