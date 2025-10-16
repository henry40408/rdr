<template>
  <ClientOnly>
    <span>{{ formatDistanceToNow(new Date(props.datetime), { addSuffix: true }) }}</span>
  </ClientOnly>
</template>

<script setup>
import { formatDistanceToNow } from "date-fns";

const props = defineProps({ datetime: { type: [String, Date], required: true } });
</script>
