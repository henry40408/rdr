<template>
  <div v-show="show">
    <q-expansion-item :id="`category-${category.id}`" group="category">
      <template #header>
        <q-item-section side>
          <q-icon size="xs" name="category" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ model.name }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <UnreadCount :count="unreadCount" />
        </q-item-section>
      </template>

      <q-list padding>
        <q-item>
          <q-item-section>
            <q-item-label caption>Name</q-item-label>
            <q-item-label>
              {{ model.name }}
              <q-icon name="edit" class="q-ml-xs" />
              <q-popup-edit v-slot="scope" v-model="model" dense buttons :validate="validate" @save="save">
                <q-input
                  v-model="scope.value.name"
                  autofocus
                  label="Name"
                  :error="error"
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
  if (!store.showErrorOnly) return true;
  return props.category.feeds.some((feed) => feed.errorCount > 0);
});
const unreadCount = computed(() => props.category.feeds.reduce((sum, feed) => sum + feed.unreadCount, 0));

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
    $q.notify({ type: "positive", message: "Category name updated successfully." });
    store.load();
  } catch (err) {
    $q.notify({ type: "negative", message: `Failed to update category name: ${err}` });
    model.value.name = props.category.name;
  }
}
</script>
