<template>
  <span v-if="datetime">
    <span v-if="onClient" title="Date" :datetime="datetime">{{ new Date(datetime).toLocaleString() }}</span>
    <span v-else title="Date" :datetime="datetime">{{ datetime }}</span>
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
