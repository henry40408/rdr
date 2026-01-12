<template>
  <div v-if="localSettings.showEmpty || count > 0" class="border-b last:border-b-0 p-2 border-b-gray-500 space-y-2">
    <div>
      <span>&gt;</span>
      {{ " " }}
      <a href="#" @click.prevent="entryStore.setCategory(category.id)" :class="{ 'text-green-500': selected }">{{
        category.name
      }}</a>
      {{ " " }}
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
const entryStore = useEntryStore();
const localSettings = useLocalSettings();

const count = computed(
  () =>
    categoryStore.categories
      .find((c) => c.id === props.category.id)
      ?.feeds.reduce((acc, f) => acc + (f.unreadCount ?? 0), 0) ?? 0,
);
const selected = computed(() => entryStore.selectedCategory?.id === props.category.id);
</script>
