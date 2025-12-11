<template>
  <q-badge color="primary" :title="formatted" :label="countLabel" />
</template>

<script setup lang="ts">
const props = defineProps<{
  count: number;
}>();

const countLabel = computed(() => (props.count > 999 ? "999+" : String(props.count)));
const formatted = computed(() => props.count.toLocaleString());
</script>
