<template>
  <q-item clickable @click="setCategoryId(categoryId)">
    <q-item-section>
      <q-item-label lines="1">{{ category.name }}</q-item-label>
    </q-item-section>
    <q-item-section side>
      <UnreadCount :count="count" />
    </q-item-section>
  </q-item>
  <HomeFeedList :category="category" :feeds="category.feeds" />
  <q-separator spaced />
</template>

<script setup lang="ts">
const props = defineProps<{
  category: {
    id: number;
    name: string;
    feeds: {
      id: number;
      title: string;
      imageExists: boolean;
      unreadCount: number;
    }[];
  };
}>();

const { setCategoryId } = useEntryFilters();
const categoryId = computed(() => String(props.category.id));
const count = computed(() => props.category.feeds.reduce((sum, feed) => sum + feed.unreadCount, 0));
</script>
