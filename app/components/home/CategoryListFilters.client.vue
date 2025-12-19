<template>
  <q-list>
    <q-item-label header>Categories</q-item-label>
    <q-item>
      <q-item-section>
        <q-select v-model="categoryStore.categorySort" filled emit-value map-options label="Sort by" :options="SORT" />
      </q-item-section>
    </q-item>
    <q-item>
      <q-item-section>
        <q-toggle v-model="categoryStore.hideEmpty" label="Hide empty" />
      </q-item-section>
    </q-item>
    <q-item>
      <q-item-section>
        <q-input v-model="categoryStore.keyword" outlined clearable label="Filter categories / feeds" />
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
const categoryStore = useCategoryStore();
</script>
