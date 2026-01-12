<template>
  <div class="text-2xl font-bold">
    (<span :title="String(store.count)">{{ countLabel }}</span
    >) {{ statusLabel }}
  </div>
</template>

<script setup lang="ts">
const store = useEntryStore();

const countLabel = computed(() => {
  const count = store.count;
  if (count > 999) return "999+";
  return count.toString();
});
const statusLabel = computed(() => {
  const status = store.status;
  if (status === "unread") return "Unread";
  if (status === "read") return "Read";
  if (status === "starred") return "Starred";
  return "All";
});
</script>
