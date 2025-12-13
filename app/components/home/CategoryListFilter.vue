<template>
  <q-list padding>
    <q-item>
      <q-item-section>
        <q-input v-model="categoryKeyword" outlined clearable debounce="500" label="Filter categories / feeds" />
      </q-item-section>
    </q-item>
    <q-item>
      <q-toggle v-model="hideEmpty" label="Hide empty categories / feeds" />
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
const { categoryKeyword } = useCategoryState();
const { hideEmpty } = useLocalSettings();
</script>
