<template>
  <span>{{ status === "success" && data ? data.count : "..." }}</span>
</template>

<script setup>
const { data, status } = await useFetch("/api/count");
</script>
