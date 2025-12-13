<template>
  <q-list padding>
    <q-item>
      <q-item-section>
        <q-input v-model="categoryKeyword" outlined clearable debounce="500" label="Filter categories" />
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
const { categoryKeyword } = useCategoryState();
</script>
