<template>
  <ClientOnly>
    <time v-if="datetime" :datetime="datetime">{{ localeString }}</time>
  </ClientOnly>
</template>

<script setup>
const props = defineProps({
  datetime: { type: String, default: "" },
});

const localeString = computed(() => {
  if (!props.datetime) return;
  return new Date(props.datetime).toLocaleString();
});
</script>
