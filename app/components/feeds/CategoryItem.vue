<template>
  <div v-show="show">
    <q-expansion-item :id="`category-${category.id}`" group="category">
      <template #header>
        <q-item-section side>
          <q-icon size="xs" name="category" />
        </q-item-section>
        <q-item-section>
          <q-item-label>
            <MarkedText :text="model.name" :keyword="store.keyword" />
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <UnreadCount :count="unreadCount" />
        </q-item-section>
      </template>

      <q-list padding>
        <q-item>
          <q-btn-group push>
            <q-btn
              label="View"
              icon="visibility"
              :href="$router.resolve({ name: 'index', query: { categoryId: category.id } }).href"
            />
            <q-btn icon="refresh" label="Refresh" :loading="refreshing" @click="onRefreshCategory()" />
            <q-btn icon="delete" label="Delete" color="negative" :loading="deleting" @click="onDeleteCategory()" />
          </q-btn-group>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label caption>Name</q-item-label>
            <q-item-label>
              {{ model.name }}
              <q-icon name="edit" class="q-ml-xs" />
              <q-popup-edit v-slot="scope" v-model="model" dense buttons :validate="validate" @save="save">
                <q-input
                  v-model="scope.value.name"
                  required
                  autofocus
                  :error="error"
                  label="Name *"
                  :error-message="errorMessage.name"
                />
              </q-popup-edit>
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-expansion-item>
    <FeedsFeedList :category="category" :feeds="category.feeds" />
    <q-separator spaced />
  </div>
</template>

<script setup lang="ts">
const $q = useQuasar();

const props = defineProps<{
  category: {
    id: number;
    name: string;
    feeds: {
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
    }[];
  };
}>();

const store = useCategoryStore();

interface CategoryModel {
  name: string;
}
interface CategoryModelError {
  name: string;
}

const errorMessage = ref<CategoryModelError>({
  name: "",
});
const model = ref<CategoryModel>({
  name: props.category.name,
});

const error = computed(() => Object.values(errorMessage.value).some((msg) => !!msg));
const show = computed(() => {
  if (store.keyword) {
    const categoryMatched = props.category.name.toLowerCase().includes(store.keyword.toLowerCase());
    const feedsMatched = props.category.feeds.some((feed) =>
      feed.title.toLowerCase().includes(store.keyword.toLowerCase()),
    );
    return categoryMatched || feedsMatched;
  }
  if (store.showErrorOnly) return props.category.feeds.some((f) => f.errorCount > 0);
  if (store.hideEmpty) return props.category.feeds.some((feed) => feed.unreadCount > 0);
  return true;
});
const unreadCount = computed(() => props.category.feeds.reduce((sum, feed) => sum + feed.unreadCount, 0));

const { pending: deleting, execute: deleteCategory } = useFetch(`/api/categories/${props.category.id}`, {
  method: "DELETE",
  immediate: false,
});
async function onDeleteCategory() {
  $q.dialog({
    title: "Delete Category",
    message: `Are you sure you want to delete category "${props.category.name}" and its feeds? This action cannot be undone.`,
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(async () => {
    try {
      await deleteCategory();
      $q.notify({ type: "positive", message: `Category "${props.category.name}" deleted successfully.` });
      store.load();
    } catch (err) {
      $q.notify({ type: "negative", message: `Failed to delete category "${props.category.name}": ${err}` });
    }
  });
}

const { pending: refreshing, execute: refreshCategory } = useAsyncData(
  `refresh-category-${props.category.id}`,
  () => {
    const tasks = [];
    for (const feed of props.category.feeds) tasks.push($fetch(`/api/feeds/${feed.id}/refresh`, { method: "POST" }));
    return Promise.allSettled(tasks);
  },
  { immediate: false },
);
async function onRefreshCategory() {
  try {
    await refreshCategory();
    $q.notify({ type: "positive", message: `Category "${props.category.name}" refreshed.` });
  } catch (err) {
    $q.notify({ type: "negative", message: `Failed to refresh category "${props.category.name}": ${err}` });
  }
}

function validate(newModel: CategoryModel) {
  const categoryNames = store.categories.map((c) => c.name);
  if (categoryNames.includes(newModel.name)) {
    errorMessage.value.name = "Category name must be unique.";
    return false;
  }
  if (!newModel.name.trim()) {
    errorMessage.value.name = "Category name cannot be empty.";
    return false;
  }
  errorMessage.value.name = "";
  return true;
}

async function save(newModel: CategoryModel) {
  try {
    await $fetch(`/api/categories/${props.category.id}`, {
      method: "PATCH",
      body: { name: newModel.name },
    });
    $q.notify({ type: "positive", message: `Category "${newModel.name}" updated successfully.` });
    store.load();
  } catch (err) {
    $q.notify({ type: "negative", message: `Failed to update category "${newModel.name}": ${err}` });
    model.value.name = props.category.name;
  }
}
</script>
