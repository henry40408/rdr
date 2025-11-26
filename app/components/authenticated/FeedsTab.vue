<template>
  <q-route-tab to="/feeds" label="Feeds">
    <q-badge v-if="count > 0" floating color="negative">{{ pending ? "..." : count }}</q-badge>
  </q-route-tab>
</template>

<script setup lang="ts">
const headers = useRequestHeaders(["cookie"]);
const {
  data: countData,
  pending,
  refresh,
} = await useFetch("/api/feeds/count", { headers, query: { status: "error" } });
const count = computed(() => countData.value?.count || 0);

const route = useRoute();
watch(
  () => route.path,
  () => {
    refresh();
  },
  { immediate: true },
);
</script>
