<template>
  <q-item>
    <q-item-section side>
      <HomeEntryItemReadToggle :entry="entry" />
    </q-item-section>
    <q-item-section>
      <q-item-label caption>
        {{ feed.title }}
        &middot;
        {{ category.name }}
        &middot;
        <TimeAgo :date="entry.date" />
      </q-item-label>
      <q-item-label>
        <span class="q-mr-xs">
          <q-avatar v-if="imageExists" square size="xs">
            <img :alt="`Feed image of ${feed.title}`" :src="`/api/images/external/${buildFeedImageKey(feed.id)}`" />
          </q-avatar>
          <q-icon v-else size="xs" name="rss_feed" />
        </span>
        {{ entry.title }}
      </q-item-label>
    </q-item-section>
    <q-item-section top side>
      <q-icon v-if="starred" size="xs" name="star" color="accent" />
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
    id: number;
    name: string;
  };
}>();

const storeC = useCategoryStore();
const storeE = useEntryStore();
const starred = computed(() => storeE.entryStars[props.entry.id] === "starred");
const imageExists = computed(
  () => storeC.categories.flatMap((c) => c.feeds).find((f) => f.id === props.feed.id)?.imageExists,
);
</script>
