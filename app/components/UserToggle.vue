<template>
  <q-toggle v-model="value" :disable="disabled" :false-value="true" :true-value="false" />
</template>

<script setup lang="ts">
import { useQuasar } from "quasar";

const $q = useQuasar();

const props = defineProps<{
  id: number;
  value: boolean;
}>();

const emit = defineEmits<{
  (e: "toggled", newValue: boolean): void;
}>();

const disabled = ref(false);
const value = ref(props.value);

watch(value, async (newVal) => {
  disabled.value = true;
  try {
    await $fetch(`/api/users/${props.id}/toggle`, { method: "PUT" });
    emit("toggled", newVal);
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to toggle user status: ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
  } finally {
    disabled.value = false;
  }
});
</script>
