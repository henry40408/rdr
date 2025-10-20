<template>
  <q-toggle v-model="value" :false-value="true" :true-value="false" />
</template>

<script setup>
const props = defineProps({
  name: { type: String, required: true },
  value: { type: Boolean, required: true },
});

const emit = defineEmits(["toggled"]);

const value = ref(props.value);

watch(value, async (newVal) => {
  try {
    await useRequestFetch()(`/api/jobs/${props.name}/toggle`, { method: "PUT" });
    emit("toggled", newVal);
  } catch (error) {
    console.error("Failed to toggle job:", error);
    value.value = !newVal; // Revert on failure
  }
});
</script>
