<template>
  <q-expansion-item v-show="show" :group="`category-${category.id}:feeds`">
    <template #header>
      <q-item-section side>
        <q-avatar v-if="feed.imageExists" square size="xs" color="white">
          <img :src="`/api/images/external/${buildFeedImageKey(feed.id)}`" />
        </q-avatar>
        <q-icon v-else size="xs" name="rss_feed" />
      </q-item-section>
      <q-item-section>
        <q-item-label>
          <span class="q-mr-xs">
            <q-icon v-if="feed.errorCount > 0" size="xs" name="error" color="negative" />
            <q-icon v-else size="xs" color="positive" name="check_circle" />
          </span>
          {{ model.title }}
        </q-item-label>
      </q-item-section>
      <q-item-section side>
        <UnreadCount :count="feed.unreadCount" />
      </q-item-section>
    </template>

    <q-list padding>
      <q-item>
        <q-item-section>
          <q-item-label caption>Fetched at</q-item-label>
          <q-item-label>
            <TimeAgo v-if="feed.fetchedAt" :datetime="feed.fetchedAt" />
            <q-badge v-else label="N/A" />
          </q-item-label>
        </q-item-section>
        <q-item-section>
          <q-item-label caption>Feed updated at</q-item-label>
          <q-item-label>
            <TimeAgo v-if="feed.feedUpdatedAt" :datetime="feed.feedUpdatedAt" />
            <q-badge v-else label="N/A" />
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label caption>Category name</q-item-label>
          <q-item-label>
            {{ model.categoryName }}
            <q-icon name="edit" class="q-ml-xs" />
            <q-popup-edit v-slot="scope" v-model="model" dense buttons @save="save">
              <FeedsCategorySelect v-model="scope.value.categoryName" />
            </q-popup-edit>
          </q-item-label>
        </q-item-section>
        <q-item-section>
          <q-item-label caption>Title</q-item-label>
          <q-item-label>
            {{ model.title }}
            <q-icon name="edit" class="q-ml-xs" />
            <q-popup-edit v-slot="scope" v-model="model" dense buttons @save="save">
              <q-input v-model="scope.value.title" autofocus label="Title" />
            </q-popup-edit>
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label caption>HTML URL</q-item-label>
          <q-item-label>
            <ExternalLink :href="model.htmlUrl">{{ model.htmlUrl }}</ExternalLink>
            <span>
              <q-icon name="edit" class="q-ml-xs" />
              <q-popup-edit v-slot="scope" v-model="model" dense buttons @save="save">
                <q-input v-model="scope.value.htmlUrl" autofocus label="HTML URL" />
              </q-popup-edit>
            </span>
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label caption>XML URL</q-item-label>
          <q-item-label>
            {{ model.xmlUrl }}
            <q-icon name="edit" class="q-ml-xs" />
            <q-popup-edit v-slot="scope" v-model="model" dense buttons @save="save">
              <q-input v-model="scope.value.xmlUrl" autofocus label="XML URL" />
            </q-popup-edit>
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label caption>Error count</q-item-label>
          <q-item-label>{{ feed.errorCount }}</q-item-label>
        </q-item-section>
        <q-item-section>
          <q-item-label caption>Last error</q-item-label>
          <q-item-label>
            <span v-if="feed.lastError">{{ feed.lastError }}</span>
            <q-badge v-else label="N/A" />
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label caption>Disable HTTP/2</q-item-label>
          <q-item-label>
            <q-badge :label="model.disableHttp2 ? 'Yes' : 'No'" :color="model.disableHttp2 ? 'positive' : 'dark'" />
            <q-icon name="edit" class="q-ml-xs" />
            <q-popup-edit v-slot="scope" v-model="model" dense buttons @save="save">
              <q-toggle v-model="scope.value.disableHttp2" label="Disable HTTP/2" />
            </q-popup-edit>
          </q-item-label>
        </q-item-section>
        <q-item-section>
          <q-item-label caption>User agent</q-item-label>
          <q-item-label>
            <span v-if="model.userAgent">{{ model.userAgent }}</span>
            <q-badge v-else label="N/A" />
            <q-icon name="edit" class="q-ml-xs" />
            <q-popup-edit v-slot="scope" v-model="model" dense buttons @save="save">
              <q-input v-model="scope.value.userAgent" autofocus label="User agent" />
            </q-popup-edit>
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-expansion-item>
</template>

<script setup lang="ts">
const $q = useQuasar();

const props = defineProps<{
  feed: {
    disableHttp2: boolean;
    errorCount: number;
    feedUpdatedAt?: string;
    fetchedAt?: string;
    htmlUrl: string;
    id: number;
    imageExists: boolean;
    lastError?: string;
    title: string;
    unreadCount: number;
    userAgent?: string;
    xmlUrl: string;
  };
  category: {
    id: number;
    name: string;
  };
}>();

const store = useCategoryStore();

interface FeedModel {
  categoryName: string;
  title: string;
  xmlUrl: string;
  htmlUrl: string;
  disableHttp2?: boolean;
  userAgent?: string;
}

const model = ref<FeedModel>({
  categoryName: props.category.name,
  title: props.feed.title,
  xmlUrl: props.feed.xmlUrl,
  htmlUrl: props.feed.htmlUrl,
  disableHttp2: props.feed.disableHttp2,
  userAgent: props.feed.userAgent,
});

const show = computed(() => {
  if (store.showErrorOnly) return props.feed.errorCount > 0;
  if (store.hideEmpty) return props.feed.unreadCount > 0;
  return true;
});

async function save(newModel: FeedModel) {
  try {
    const disableHttp2 = newModel.disableHttp2 ?? false;
    const userAgent = newModel.userAgent?.trim() ?? undefined;
    await $fetch(`/api/feeds/${props.feed.id}`, {
      method: "PATCH",
      body: {
        categoryName: newModel.categoryName,
        title: newModel.title,
        xmlUrl: newModel.xmlUrl,
        htmlUrl: newModel.htmlUrl,
        disableHttp2,
        userAgent,
      },
    });
    $q.notify({ type: "positive", message: "Feed category updated successfully." });
    store.load();
  } catch (err) {
    $q.notify({ type: "negative", message: `Failed to update feed category: ${err}` });
    model.value.categoryName = props.category.name;
  }
}
</script>
