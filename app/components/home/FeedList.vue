<template>
  <HomeFeedItem v-for="feed in feeds" :key="feed.id" :feed="feed" :category="category" />
</template>

<script setup lang="ts">
const props = defineProps<{
  category: {
    id: number;
  };
}>();

const store = useCategoryStore();
const feeds = computed(() => store.categories.find((c) => c.id === props.category.id)?.feeds || []);
</script>
