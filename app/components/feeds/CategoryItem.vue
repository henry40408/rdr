<template>
  <q-expansion-item :id="`category-${category.id}`" group="category" expand-icon-toggle>
    <template #header>
      <q-item-section side>
        <q-icon size="xs" name="category" />
      </q-item-section>
      <q-item-section>
        <q-item-label>{{ categoryName }}</q-item-label>
      </q-item-section>
      <q-item-section side>
        <UnreadCount :count="unreadCount" />
      </q-item-section>
      <q-item-section side>
        <q-btn
          flat
          round
          replace
          icon="search"
          :href="$router.resolve({ name: 'index', query: { categoryId: category.id } }).href"
        />
      </q-item-section>
    </template>

    <q-list padding>
      <q-item>
        <q-item-section>
          <q-item-label caption>Name</q-item-label>
          <q-item-label>
            <div class="row items-center q-gutter-sm">
              <div>{{ categoryName }}</div>
              <q-icon name="edit" />
            </div>
            <q-popup-edit
              v-slot="scope"
              v-model="categoryName"
              dense
              buttons
              :validate="validate"
              @save="updateCategory"
            >
              <q-input
                v-model="scope.value"
                autofocus
                :error="error"
                :error-message="errorMessage"
                @keyup.enter="scope.set"
              />
            </q-popup-edit>
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-expansion-item>
  <FeedsFeedList :category="category" :feeds="category.feeds" />
  <q-separator spaced />
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

const errorMessage = ref("");
const categoryName = ref(props.category.name);

const error = computed(() => !!errorMessage.value);
const unreadCount = computed(() => props.category.feeds.reduce((sum, feed) => sum + feed.unreadCount, 0));

function validate(name: string) {
  const categoryNames = store.categories.map((c) => c.name);
  if (categoryNames.includes(name)) {
    errorMessage.value = "Category name must be unique.";
    return false;
  }
  if (!name.trim()) {
    errorMessage.value = "Category name cannot be empty.";
    return false;
  }
  errorMessage.value = "";
  return true;
}

async function updateCategory(name: string) {
  try {
    await $fetch(`/api/categories/${props.category.id}`, {
      method: "PATCH",
      body: { name },
    });
    $q.notify({ type: "positive", message: "Category name updated successfully." });
    store.load();
  } catch (err) {
    $q.notify({ type: "negative", message: `Failed to update category name: ${err}` });
    categoryName.value = props.category.name;
  }
}
</script>
