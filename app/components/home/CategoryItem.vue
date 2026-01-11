<template>
  <div class="mb-4">
    <div>
      <span class="text-gray-600 dark:text-gray-400">&gt;</span>
      {{ category.name }}
      <span class="text-gray-600 dark:text-gray-400">({{ count }})</span>
    </div>
    <div>
      <HomeFeedList :category="category" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  category: {
    id: number;
    name: string;
    feeds: {
      id: number;
      title: string;
      unreadCount: number;
    }[];
  };
}>();

const categoryStore = useCategoryStore();

const count = computed(
  () =>
    categoryStore.categories
      .find((c) => c.id === props.category.id)
      ?.feeds.reduce((acc, f) => acc + (f.unreadCount ?? 0), 0) ?? 0,
);
</script>
