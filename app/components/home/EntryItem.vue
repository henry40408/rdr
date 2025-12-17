<template>
  <q-expansion-item group="entry" hide-expand-icon>
    <template #header>
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
    </template>

    <template #default>
      <q-card>
        <q-card-section>
          <span class="text-h6">
            <ExternalLink :href="entry.link">
              {{ entry.title }}
            </ExternalLink>
          </span>
        </q-card-section>
        <q-card-section>
          <q-chip outline clickable @click="storeE.selectCategory(category.id)">
            <q-avatar color="primary" text-color="white">
              <q-icon name="category" />
            </q-avatar>
            Category: {{ category.name }}
          </q-chip>
          <q-chip outline clickable @click="storeE.selectFeed(category.id, feed.id)">
            <q-avatar color="secondary" text-color="white">
              <q-icon name="rss_feed" />
            </q-avatar>
            Feed: {{ feed.title }}
          </q-chip>
          <q-chip outline>
            <q-avatar color="accent" text-color="white">
              <q-icon name="calendar_today" />
            </q-avatar>
            Date:&nbsp;<DateTime :date="entry.date" />
          </q-chip>
        </q-card-section>
      </q-card>
    </template>
  </q-expansion-item>
</template>

<script setup lang="ts">
const props = defineProps<{
  entry: {
    id: number;
    title: string;
    date: string;
    link: string;
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
