<template>
  <q-page-sticky v-if="expanded" :offset="[16, 16]" position="bottom-right">
    <div class="column q-gutter-md">
      <q-btn fab :icon="starIcon" color="secondary" :loading="starring" @click="store.toggleExpandedStar" />
      <q-btn fab :icon="readIcon" color="secondary" :loading="reading" @click="store.toggleExpandedRead" />
      <q-btn fab icon="close" color="primary" @click="store.closeExpanded" />
    </div>
  </q-page-sticky>
</template>

<script setup lang="ts">
const store = useEntryStore();

const expanded = computed(() => Object.values(store.expands).some((v) => v));

const reading = computed(() => store.expandedRead === "reading");
const readIcon = computed(() => (store.expandedRead === "read" ? "drafts" : "mail"));

const starring = computed(() => store.expandedStarred === "starring");
const starIcon = computed(() => (store.expandedStarred === "starred" ? "star" : "star_border"));
</script>
