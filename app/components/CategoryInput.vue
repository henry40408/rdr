<template>
  <q-select
    v-model="model"
    outlined
    use-chips
    use-input
    label="Category Name *"
    :options="filteredCategoryOptions"
    @new-value="addCategory"
    @filter="filterCategories"
  />
</template>

<script setup lang="ts">
import type { QSelect } from "quasar";

const model = defineModel<string | null>();

const props = defineProps<{ categoryList: string[] }>();
const filteredCategoryOptions = ref<string[]>(props.categoryList);

function addCategory(inputValue: string, doneFn: (val: string, mode: "add" | "add-unique" | "toggle") => void) {
  if (inputValue && !props.categoryList.includes(inputValue)) {
    model.value = inputValue;
  }
  doneFn(inputValue, "toggle");
}

function filterCategories(
  inputValue: string,
  doneFn: (callbackFn: () => void, afterFn?: (component: QSelect) => void) => void,
  _abortFn: () => void,
) {
  doneFn(() => {
    if (!inputValue) {
      filteredCategoryOptions.value = props.categoryList;
    } else {
      const filter = inputValue.toLowerCase();
      filteredCategoryOptions.value = props.categoryList.filter((option) => option.toLowerCase().includes(filter));
    }
  });
}
</script>
