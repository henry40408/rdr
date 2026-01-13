<template>
  <div v-if="localSettings.showEmpty || feed.unreadCount > 0">
    <span class="mr-4">
      <img
        v-if="imageExists"
        class="bg-white inline h-4 w-4"
        :src="`/api/images/external/${buildFeedImageKey(feed.id)}`"
      />
      <span v-else>&#x1F4E1;</span>
    </span>
    <a
      href="#"
      :class="{ 'text-green-700 dark:text-green-400 font-bold': selected }"
      @click.prevent="entryStore.setFeed(feed.id, category.id)"
    >
      {{ feed.title }}
    </a>
    {{ " " }}
    <span>({{ feed.unreadCount }})</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  feed: {
    id: number;
    title: string;
    unreadCount: number;
  };
  category: {
    id: number;
    name: string;
  };
}>();

const categoryStore = useCategoryStore();
const entryStore = useEntryStore();
const localSettings = useLocalSettings();

const imageExists = computed(() => {
  const feeds = categoryStore.categories.find((c) => c.id === props.category.id)?.feeds || [];
  return feeds.find((f) => f.id === props.feed.id)?.imageExists ?? false;
});
const selected = computed(
  () => entryStore.selectedFeed?.id === props.feed.id && entryStore.selectedCategory?.id === props.category.id,
);
</script>
