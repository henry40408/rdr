<template>
  <q-chip v-if="category" outline removable @remove="setCategoryId(undefined)">
    <q-avatar color="primary" text-color="white">
      <q-icon name="category" />
    </q-avatar>
    Category: {{ category.name }}
  </q-chip>
</template>

<script setup lang="ts">
const { categories } = useCategories();
const { selectedCategoryId, setCategoryId } = useEntryState();
const category = computed(() => categories.value.find((cat) => String(cat.id) === selectedCategoryId.value));
</script>
