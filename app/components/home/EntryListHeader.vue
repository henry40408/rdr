<template>
  <div class="q-py-sm">{{ statusLabel }}</div>
</template>

<script setup lang="ts">
const store = useEntryStore();

const statusLabel = computed(() => STATUS.find((s) => s.value === store.status)?.label ?? DEFAULT_STATUS.label);
</script>
