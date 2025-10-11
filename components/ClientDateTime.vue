<template>
  <span v-if="datetime">
    <span v-if="onClient" :datetime="datetime" title="Date">{{ new Date(datetime).toLocaleString() }}</span>
    <span v-else :datetime="datetime" title="Date">{{ datetime }}</span>
  </span>
</template>

<script setup>
defineProps({
  datetime: { type: String, default: null },
});

const onClient = ref(false);
onMounted(() => {
  onClient.value = true;
});
</script>
