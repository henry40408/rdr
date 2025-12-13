<template>
  <q-expansion-item v-model="expands[entry.id]" group="entries">
    <template #header>
      <q-item-section side>
        <HomeEntryStatusToggle :entry-id="entry.id" />
      </q-item-section>
      <q-item-section>
        <q-item-label caption>
          {{ feed.title }}
          &middot;
          {{ category.name }}
          &middot;
          <DistanceToNow :date="entry.date" />
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
    </template>

    <q-card>
      <q-card-section>
        <ExternalAnchor :href="entry.link">
          <span class="text-h6">{{ entry.title }}</span>
        </ExternalAnchor>
      </q-card-section>
      <q-card-section>
        <q-chip outline>
          <q-avatar color="primary" text-color="white">
            <q-icon name="category" />
          </q-avatar>
          Category: {{ category.name }}
        </q-chip>
        <q-chip outline>
          <q-avatar color="secondary" text-color="white">
            <q-icon name="rss_feed" />
          </q-avatar>
          Feed: {{ feed.title }}
        </q-chip>
        <q-chip outline>
          <q-avatar color="grey" text-color="white">
            <q-icon name="calendar_today" />
          </q-avatar>
          <DateTime :date="entry.date" />
        </q-chip>
      </q-card-section>
      <q-card-section v-if="contentStatus === 'pending'" class="entry-content">
        <q-skeleton type="text" width="80%" />
        <q-skeleton type="text" width="90%" />
        <q-skeleton type="text" width="70%" />
      </q-card-section>
      <q-card-section v-else class="entry-content">
        <MarkedText :text="content" />
      </q-card-section>
    </q-card>
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
    name: string;
  };
}>();

const { categories } = useCategories();
const imageExists = computed(() => {
  const category = categories.value.flatMap((c) => c.feeds).find((f) => f.id === props.feed.id);
  return category ? category.imageExists : false;
});
const { expands } = useEntryState();

const {
  data: contentData,
  status: contentStatus,
  execute: fetchContent,
} = await useFetch(`/api/entries/${props.entry.id}/content`, {
  key: `entry-content-${props.entry.id}`,
  immediate: false,
});
const content = computed(() => contentData.value?.content ?? "");
watch(
  () => expands.value[props.entry.id],
  (newVal, oldVal) => {
    if (contentStatus.value !== "idle") return;
    if (!oldVal && newVal) fetchContent();
  },
);
</script>
