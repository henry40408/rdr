<template>
  <details @toggle="toggle">
    <summary>Read</summary>
    <div v-if="status === 'pending'">Loading...</div>
    <div v-else-if="contentData" v-html="contentData.content"></div>
    <div v-else-if="error">Error: {{ error.message }}</div>
  </details>
</template>

<script setup>
const props = defineProps({
  entryId: { type: String, required: true },
});

const opened = ref(false);

const {
  data: contentData,
  error,
  execute,
  status,
} = useFetch(`/api/entries/${props.entryId}/content`, {
  immediate: false,
});

/** @param {Event} e */
function toggle(e) {
  /** @type {EventTarget|null} */
  const target = e.target;
  if (target instanceof HTMLDetailsElement) opened.value = target.open;
}

watch(opened, (isOpened) => {
  if (isOpened && "idle" == status.value) execute();
});
</script>
