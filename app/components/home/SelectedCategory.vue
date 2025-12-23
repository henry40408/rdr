<template>
  <q-chip v-if="category" outline removable @remove="entryStore.setCategoryId(undefined)">
    <q-avatar color="primary" text-color="white">
      <q-icon name="category" />
    </q-avatar>
    Category: {{ category.name }}
  </q-chip>
</template>

<script setup lang="ts">
const categoryStore = useCategoryStore();
const entryStore = useEntryStore();

const category = computed(() =>
  categoryStore.categories.find((cat) => String(cat.id) === entryStore.selectedCategoryId),
);
</script>
