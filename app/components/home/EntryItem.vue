<template>
  <q-expansion-item
    group="entry"
    hide-expand-icon
    :model-value="expanded"
    @before-show="loadContent()"
    @update:model-value="entryStore.toggleExpand(entry.id)"
  >
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
        <q-card-section class="row items-center q-gutter-xs">
          <q-checkbox
            v-model="starred"
            checked-icon="star"
            unchecked-icon="star_outline"
            @update:model-value="entryStore.toggleEntryStar(entry.id)"
          />
          <div class="text-h6">
            <ExternalLink :href="entry.link">
              {{ entry.title }}
            </ExternalLink>
          </div>
        </q-card-section>
        <q-card-section>
          <q-chip outline>
            <q-avatar color="accent" text-color="white">
              <q-icon name="person" />
            </q-avatar>
            Author: {{ entry.author }}
          </q-chip>
          <q-chip outline clickable @click="entryStore.setCategoryId(category.id)">
            <q-avatar color="primary" text-color="white">
              <q-icon name="category" />
            </q-avatar>
            Category: {{ category.name }}
          </q-chip>
          <q-chip outline clickable @click="entryStore.setFeedId(category.id, feed.id)">
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

        <q-card-section>
          <div v-if="contentStatus === 'pending'" class="q-gutter-sm">
            <q-skeleton animated width="80%" />
            <q-skeleton animated width="90%" />
            <q-skeleton animated width="70%" />
          </div>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="entry-content" v-html="content" />
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
    author?: string;
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

const categoryStore = useCategoryStore();
const entryStore = useEntryStore();

const content = ref("");
const {
  data: contentData,
  status: contentStatus,
  execute: fetchContent,
} = useFetch(`/api/entries/${props.entry.id}/content`, { immediate: false });
const expanded = computed(() => !!entryStore.expands[props.entry.id]);

const starred = computed(() => entryStore.entryStars[props.entry.id] === "starred");
const imageExists = computed(
  () => categoryStore.categories.flatMap((c) => c.feeds).find((f) => f.id === props.feed.id)?.imageExists,
);

async function loadContent() {
  if (expanded.value && contentStatus.value === "idle") {
    await fetchContent();
    content.value = contentData.value?.content ?? "";
  }
}
</script>
