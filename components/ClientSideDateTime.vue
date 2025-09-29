<template>
  <time v-if="onClient" :datetime="datetime">{{ new Date(datetime).toLocaleString() }}</time>
  <time v-else :datetime="datetime">{{ datetime }}</time>
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
