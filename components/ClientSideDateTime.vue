<template>
  <span v-if="onClient" :datetime="datetime" title="Date">{{ new Date(datetime).toLocaleString() }}</span>
  <span v-else :datetime="datetime" title="Date">{{ datetime }}</span>
</template>

<script setup>
defineProps({
  datetime: { type: String, required: true },
});

const onClient = ref(false);
onMounted(() => {
  onClient.value = true;
});
</script>
