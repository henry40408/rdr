<template>
  <q-badge color="primary" :outline="isZero">{{ countLabel }}</q-badge>
</template>

<script setup lang="ts">
const props = defineProps<{
  count: number;
}>();

const countLabel = computed(() => {
  if (props.count > 99) return "99+";
  return String(props.count);
});
const isZero = computed(() => props.count === 0);
</script>
