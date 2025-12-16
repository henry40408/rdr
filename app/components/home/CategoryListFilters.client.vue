<template>
  <q-list>
    <q-item-label header>Categories</q-item-label>
    <q-item>
      <q-item-section>
        <q-toggle v-model="storeC.hideEmpty" label="Hide empty" />
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
const storeC = useCategoryStore();
</script>
