<template>
  <div v-if="localSettings.showEmpty || count > 0" class="border-b last:border-b-0 p-2">
    <div>
      <span>&gt;</span>
      {{ category.name }}
      <span>({{ count }})</span>
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
const localSettings = useLocalSettings();

const count = computed(
  () =>
    categoryStore.categories
      .find((c) => c.id === props.category.id)
      ?.feeds.reduce((acc, f) => acc + (f.unreadCount ?? 0), 0) ?? 0,
);
</script>
