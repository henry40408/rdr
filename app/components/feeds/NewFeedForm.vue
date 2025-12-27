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
            type="url"
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
          <q-input v-model="model.htmlUrl" filled type="url" color="primary" label="HTML URL" />
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
import { z } from "zod";

const $q = useQuasar();

const store = useCategoryStore();

const schema = z.object({
  categoryName: z.string().nonempty(),
  xmlUrl: z.url(),
  htmlUrl: z.union([z.literal(""), z.url()]),
});
type Schema = z.infer<typeof schema>;

const errorMessages = ref({
  categoryName: "",
  xmlUrl: "",
});
const model = ref<Schema>({
  categoryName: "",
  xmlUrl: "",
  htmlUrl: "",
});

const error = computed(() => Object.values(errorMessages.value).some((msg) => !!msg));

async function onSubmit() {
  errorMessages.value = {
    categoryName: "",
    xmlUrl: "",
  };

  try {
    const result = schema.safeParse(model.value);
    if (!result.success) {
      const fieldErrors = z.flattenError(result.error).fieldErrors;
      errorMessages.value = {
        categoryName: fieldErrors.categoryName?.join(", ") ?? "",
        xmlUrl: fieldErrors.xmlUrl?.join(", ") ?? "",
      };
      return;
    }
    const parsed = result.data;

    await $fetch("/api/feeds", {
      method: "POST",
      body: {
        categoryName: parsed.categoryName,
        xmlUrl: parsed.xmlUrl,
        htmlUrl: parsed.htmlUrl || undefined,
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
