<template>
  <q-chip v-if="category" outline removable @remove="storeE.selectCategory(undefined)">
    <q-avatar color="primary" text-color="white">
      <q-icon name="category" />
    </q-avatar>
    Category: {{ category.name }}
  </q-chip>
</template>

<script setup lang="ts">
const storeC = useCategoryStore();
const storeE = useEntryStore();
const category = computed(() => storeC.categories.find((cat) => String(cat.id) === storeE.selectedCategoryId));
</script>
