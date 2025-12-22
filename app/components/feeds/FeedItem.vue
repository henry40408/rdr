<template>
  <q-expansion-item v-show="show" :group="`category-${category.id}:feeds`">
    <template #header>
      <q-item-section side>
        <q-icon v-if="feed.errorCount > 0" size="xs" name="error" color="negative" />
        <q-icon v-else-if="feed.fetchedAt" size="xs" color="positive" name="check_circle" />
        <q-icon v-else size="xs" name="pending" />
      </q-item-section>
      <q-item-section side>
        <q-avatar v-if="feed.imageExists" square size="xs" color="white">
          <img :src="`/api/images/external/${buildFeedImageKey(feed.id)}`" />
        </q-avatar>
        <q-icon v-else size="xs" name="rss_feed" />
      </q-item-section>
      <q-item-section>
        <q-item-label lines="1">
          <MarkedText :text="model.title" :keyword="store.keyword" />
        </q-item-label>
      </q-item-section>
      <q-item-section side>
        <UnreadCount :count="feed.unreadCount" />
      </q-item-section>
    </template>

    <q-list>
      <q-item>
        <q-btn-group push>
          <q-btn
            label="View"
            icon="visibility"
            :href="$router.resolve({ name: 'index', query: { categoryId: category.id, feedId: feed.id } }).href"
          />
          <q-btn icon="refresh" label="Refresh" :loading="refreshing" @click="onRefreshFeed()" />
          <q-btn icon="delete" label="Delete" color="negative" :loading="deleting" @click="onDeleteFeed()" />
        </q-btn-group>
      </q-item>
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
            <q-popup-edit v-slot="scope" v-model="model" dense buttons :validate="validate" @save="save">
              <q-input
                v-model="scope.value.title"
                required
                autofocus
                :error="error"
                label="Title *"
                :error-message="errorMessages.title"
              />
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
            <q-popup-edit v-slot="scope" v-model="model" dense buttons :validate="validate" @save="save">
              <q-input
                v-model="scope.value.xmlUrl"
                required
                autofocus
                :error="error"
                label="XML URL *"
                :error-message="errorMessages.xmlUrl"
              />
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

const errorMessages = ref({
  title: "",
  xmlUrl: "",
});
const model = ref<FeedModel>({
  categoryName: props.category.name,
  title: props.feed.title,
  xmlUrl: props.feed.xmlUrl,
  htmlUrl: props.feed.htmlUrl,
  disableHttp2: props.feed.disableHttp2,
  userAgent: props.feed.userAgent,
});

const error = computed(() => !!errorMessages.value.title || !!errorMessages.value.xmlUrl);
const show = computed(() => {
  if (store.keyword) return props.feed.title.toLowerCase().includes(store.keyword.toLowerCase());
  if (store.showErrorOnly) return props.feed.errorCount > 0;
  if (store.hideEmpty) return props.feed.unreadCount > 0;
  return true;
});

const { pending: deleting, execute: deleteFeed } = useFetch(`/api/feeds/${props.feed.id}`, {
  method: "DELETE",
  immediate: false,
});
async function onDeleteFeed() {
  $q.dialog({
    title: "Delete Feed",
    message: `Are you sure you want to delete the feed "${props.feed.title}"? This action cannot be undone.`,
    cancel: true,
    ok: { color: "negative" },
  }).onOk(async () => {
    try {
      await deleteFeed();
      $q.notify({ type: "positive", message: `Feed "${props.feed.title}" deleted successfully.` });
      store.load();
    } catch (err) {
      $q.notify({ type: "negative", message: `Failed to delete feed "${props.feed.title}": ${err}` });
    }
  });
}

const { pending: refreshing, execute: refreshFeed } = useFetch(`/api/feeds/${props.feed.id}/refresh`, {
  method: "POST",
  immediate: false,
});
async function onRefreshFeed() {
  try {
    await refreshFeed();
    $q.notify({ type: "positive", message: `Feed "${props.feed.title}" refreshed.` });
    store.load();
  } catch (err) {
    $q.notify({ type: "negative", message: `Failed to refresh feed "${props.feed.title}": ${err}` });
  }
}

function validate(newModel: FeedModel) {
  if (!newModel.title.trim()) {
    errorMessages.value.title = "Title cannot be empty.";
    return false;
  }
  errorMessages.value.title = "";
  if (!newModel.xmlUrl.trim()) {
    errorMessages.value.xmlUrl = "XML URL cannot be empty.";
    return false;
  }
  errorMessages.value.xmlUrl = "";
  return true;
}

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
    $q.notify({ type: "positive", message: `Feed "${newModel.title}" updated successfully.` });
    store.load();
  } catch (err) {
    $q.notify({ type: "negative", message: `Failed to update feed "${newModel.title}": ${err}` });
    model.value.categoryName = props.category.name;
  }
}
</script>
