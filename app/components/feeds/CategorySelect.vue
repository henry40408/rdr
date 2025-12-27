<template>
  <q-select
    v-model="model"
    filled
    use-input
    emit-value
    map-options
    :error="error"
    hide-bottom-space
    :options="options"
    label="Category name *"
    :error-message="errorMessage"
    @filter="filter"
    @new-value="createValue"
  />
</template>

<script setup lang="ts">
const model = defineModel<string>();

defineProps<{
  error?: boolean | null;
  errorMessage?: string;
}>();

const store = useCategoryStore();
const options = ref(
  store.categories.map((category) => ({
    label: category.name,
    value: category.name,
  })),
);

function createValue(val: string, done: (newVal: string, action?: "add" | "add-unique" | "toggle") => void) {
  done(val, "add-unique");
}

function filter(value: string, update: (cb: () => void) => void) {
  update(() => {
    const needle = value.toLowerCase().trim();
    if (!needle) {
      options.value = store.categories.map((category) => ({ label: category.name, value: category.name }));
    } else {
      options.value = store.categories
        .filter((category) => category.name.toLowerCase().includes(needle))
        .map((category) => ({ label: category.name, value: category.name }));
    }
  });
}
</script>
