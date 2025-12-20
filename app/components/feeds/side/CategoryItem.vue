<template>
  <q-item clickable @click="$router.push({ name: 'feeds', hash: `#category-${category.id}` })">
    <q-item-section>
      <q-item-label>{{ category.name }}</q-item-label>
    </q-item-section>
    <q-item-section side>
      <UnreadCount :count="unreadCount" />
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
const props = defineProps<{
  category: {
    id: number;
    name: string;
    feeds: {
      unreadCount: number;
    }[];
  };
}>();

const unreadCount = computed(() => props.category.feeds.reduce((sum, feed) => sum + feed.unreadCount, 0));
</script>
