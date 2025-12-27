<template>
  <q-form @submit="onSubmit">
    <q-list>
      <q-item-label header>New feed</q-item-label>
      <q-item>
        <q-item-section>
          <FeedsCategorySelect
            v-model="model.categoryName"
            :error="error"
            :error-message="errorMessages.categoryName"
          />
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-input
            v-model="model.xmlUrl"
            filled
            :error="error"
            color="primary"
            hide-bottom-space
            label="XML URL *"
            :error-message="errorMessages.xmlUrl"
          />
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-input v-model="model.htmlUrl" filled color="primary" label="HTML URL" />
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-btn type="submit" color="primary" label="Add Feed" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-form>
</template>

<script setup lang="ts">
const $q = useQuasar();

const store = useCategoryStore();

interface NewFeedFormModel {
  categoryName: string;
  xmlUrl: string;
  htmlUrl: string;
}

const errorMessages = ref({
  categoryName: "",
  xmlUrl: "",
});
const model = ref<NewFeedFormModel>({
  categoryName: "",
  xmlUrl: "",
  htmlUrl: "",
});

const error = computed(() => !!errorMessages.value.categoryName || !!errorMessages.value.xmlUrl);

function validate(newModel: NewFeedFormModel) {
  if (!newModel.categoryName) {
    errorMessages.value.categoryName = "Category is required.";
    return false;
  }
  errorMessages.value.categoryName = "";
  if (!newModel.xmlUrl) {
    errorMessages.value.xmlUrl = "XML URL is required.";
    return false;
  }
  errorMessages.value.xmlUrl = "";
  return true;
}

async function onSubmit() {
  if (!validate(model.value)) return;
  try {
    await $fetch("/api/feeds", {
      method: "POST",
      body: {
        categoryName: model.value.categoryName,
        xmlUrl: model.value.xmlUrl,
        htmlUrl: model.value.htmlUrl || undefined,
      },
    });
    model.value = {
      categoryName: "",
      xmlUrl: "",
      htmlUrl: "",
    };
    errorMessages.value = {
      categoryName: "",
      xmlUrl: "",
    };
    $q.notify({
      type: "positive",
      message: "Feed added successfully.",
    });
    store.load();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to add feed: ${err}`,
    });
  }
}
</script>
