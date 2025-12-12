<template>
  <q-item>
    <q-item-section side>
      <HomeEntryStatusToggle :entry-id="entry.id" />
    </q-item-section>
    <q-item-section>
      <q-item-label caption>
        {{ feed.title }}
        &middot;
        {{ category.name }}
        &middot;
        <DistinaceToNow :date="entry.date" />
      </q-item-label>
      <q-item-label>
        <q-avatar v-if="imageExists" square size="xs" class="q-mr-xs">
          <img
            loading="lazy"
            decoding="async"
            :alt="`Feed Image for ${feed.title}`"
            :src="`/api/images/external/${buildFeedImageKey(feed.id)}`"
          />
        </q-avatar>
        <q-icon v-else size="xs" class="q-mr-xs" name="rss_feed" />
        {{ entry.title }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
const props = defineProps<{
  entry: {
    id: number;
    title: string;
    date: string;
  };
  feed: {
    id: number;
    title: string;
  };
  category: {
    name: string;
  };
}>();

const { categories } = useCategories();
const imageExists = computed(() => {
  const category = categories.value.flatMap((c) => c.feeds).find((f) => f.id === props.feed.id);
  return category ? category.imageExists : false;
});
</script>
