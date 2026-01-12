<template>
  <div v-if="localSettings.showEmpty || feed.unreadCount > 0">
    <span>&gt;&gt;</span>
    {{ " " }}
    <a
      href="#"
      :class="{ 'text-green-600 dark:text-green-400': selected }"
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

const entryStore = useEntryStore();
const localSettings = useLocalSettings();

const selected = computed(
  () => entryStore.selectedFeed?.id === props.feed.id && entryStore.selectedCategory?.id === props.category.id,
);
</script>
