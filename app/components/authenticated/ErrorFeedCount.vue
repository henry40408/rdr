<template>
  <span>{{ count }}</span>
</template>

<script setup>
const { headers } = useRequestHeaders(["cookie"]);
const { data: countData } = await useFetch("/api/feeds/count", { headers, query: { status: "error" } });
const count = computed(() => countData.value?.count || 0);
</script>
