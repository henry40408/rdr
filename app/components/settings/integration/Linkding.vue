<template>
  <q-form @submit="onSubmit">
    <q-list>
      <q-item-label header>Integration: Linkding</q-item-label>
      <q-banner :class="$q.dark.isActive ? 'bg-grey-9 text-white' : 'bg-grey-3'">
        <q-icon v-if="enabled" class="q-mr-sm" color="positive" name="check_circle" />
        <q-icon v-else name="block" class="q-mr-sm" color="negative" />
        Linkding integration is
        <span v-if="enabled">enabled</span>
        <span v-else>disabled</span>.
      </q-banner>
    </q-list>
    <q-list>
      <q-item>
        <q-item-section>
          <q-input
            v-model="model.linkdingApiUrl"
            filled
            clearable
            type="url"
            :error="error"
            hide-bottom-space
            label="Linkding API URL"
            placeholder="https://example.com"
            :error-message="errorMessages.linkdingApiUrl"
          />
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-input
            v-model="model.linkdingApiToken"
            filled
            clearable
            :error="error"
            type="password"
            hide-bottom-space
            label="Linkding API Token"
            :error-message="errorMessages.linkdingApiToken"
          />
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-select
            v-model="model.linkdingDefaultTags"
            filled
            multiple
            clearable
            use-chips
            use-input
            :error="error"
            hide-bottom-space
            hide-dropdown-icon
            label="Default Tags"
            new-value-mode="add-unique"
            hint="Tags to be added to each saved link"
            :error-message="errorMessages.linkdingDefaultTags"
          />
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-btn label="Save" type="submit" color="primary" :loading="pending" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-form>
</template>

<script setup lang="ts">
import { z } from "zod";

const $q = useQuasar();

const store = useUserSettingsStore();

const schema = z.object({
  linkdingApiUrl: z.union([z.literal(""), z.url()]),
  linkdingApiToken: z.string().or(z.literal("")),
  linkdingDefaultTags: z.array(z.string()),
});
type Schema = z.infer<typeof schema>;

const model = ref<Schema>({
  linkdingApiUrl: store.userSettings?.linkdingApiUrl ?? "",
  linkdingApiToken: store.userSettings?.linkdingApiToken ?? "",
  linkdingDefaultTags:
    (store.userSettings?.linkdingDefaultTags && JSON.parse(store.userSettings.linkdingDefaultTags)) ?? [],
});
const enabled = ref(!!model.value.linkdingApiUrl?.trim() && !!model.value.linkdingApiToken?.trim());
const errorMessages = ref({
  linkdingApiUrl: "",
  linkdingApiToken: "",
  linkdingDefaultTags: "",
});
const error = computed(() => Object.values(errorMessages.value).some((msg) => !!msg));

const pending = ref(false);
async function onSubmit() {
  errorMessages.value = {
    linkdingApiUrl: "",
    linkdingApiToken: "",
    linkdingDefaultTags: "",
  };

  const result = schema.safeParse(model.value);
  if (!result.success) {
    const fieldErrors = z.flattenError(result.error).fieldErrors;
    errorMessages.value = {
      linkdingApiUrl: fieldErrors.linkdingApiUrl?.join(", ") ?? "",
      linkdingApiToken: fieldErrors.linkdingApiToken?.join(", ") ?? "",
      linkdingDefaultTags: fieldErrors.linkdingDefaultTags?.join(", ") ?? "",
    };
    return;
  }

  pending.value = true;
  try {
    await $fetch("/api/user-settings", {
      method: "PATCH",
      body: {
        linkdingApiUrl: model.value.linkdingApiUrl,
        linkdingApiToken: model.value.linkdingApiToken,
        linkdingDefaultTags: JSON.stringify(model.value.linkdingDefaultTags),
      },
    });
    $q.notify({
      type: "positive",
      message: "Linkding settings saved successfully",
    });
    errorMessages.value = {
      linkdingApiUrl: "",
      linkdingApiToken: "",
      linkdingDefaultTags: "",
    };
    store.load();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to save Linkding settings: ${err}`,
    });
  } finally {
    pending.value = false;
  }
}
</script>
