<template>
  <q-form @submit="onSubmit">
    <q-list>
      <q-item-label header>Integration: Kagi summarizer</q-item-label>
      <q-banner :class="$q.dark.isActive ? 'bg-grey-9 text-white' : 'bg-grey-3'">
        <q-icon v-if="enabled" class="q-mr-sm" color="positive" name="check_circle" />
        <q-icon v-else name="block" class="q-mr-sm" color="negative" />
        Kagi Summarizer integration is
        <span v-if="enabled">enabled</span>
        <span v-else>disabled</span>.
      </q-banner>
      <q-item>
        <q-item-section>
          <q-select
            v-model="model.kagiLanguage"
            filled
            emit-value
            map-options
            :error="error"
            label="Language"
            hide-bottom-space
            :options="options"
            :error-message="errors.kagiLanguage"
          />
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-input
            v-model="model.kagiSessionLink"
            filled
            clearable
            type="url"
            :error="error"
            hide-bottom-space
            label="Kagi Session Link"
            :error-message="errors.kagiSessionLink"
            placeholder="https://kagi.com/search?token=TOKEN"
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

const defaultOption = { label: "English", value: "EN" } as const;
const options = [
  defaultOption,
  { label: "Bulgarian", value: "BG" },
  { label: "Czech", value: "CS" },
  { label: "Danish", value: "DA" },
  { label: "German", value: "DE" },
  { label: "Greek", value: "EL" },
  { label: "Spanish", value: "ES" },
  { label: "Estonian", value: "ET" },
  { label: "Finnish", value: "FI" },
  { label: "French", value: "FR" },
  { label: "Hungarian", value: "HU" },
  { label: "Indonesian", value: "ID" },
  { label: "Italian", value: "IT" },
  { label: "Japanese", value: "JA" },
  { label: "Korean", value: "KO" },
  { label: "Lithuanian", value: "LT" },
  { label: "Latvian", value: "LV" },
  { label: "Norwegian", value: "NB" },
  { label: "Dutch", value: "NL" },
  { label: "Polish", value: "PL" },
  { label: "Portuguese", value: "PT" },
  { label: "Romanian", value: "RO" },
  { label: "Russian", value: "RU" },
  { label: "Slovak", value: "SK" },
  { label: "Slovenian", value: "SL" },
  { label: "Swedish", value: "SV" },
  { label: "Turkish", value: "TR" },
  { label: "Ukrainian", value: "UK" },
  { label: "Chinese (simplified)", value: "ZH" },
  { label: "Chinese (traditional)", value: "ZH-HANT" },
] as const;

const schema = z.object({
  kagiLanguage: z.enum([
    "EN",
    "BG",
    "CS",
    "DA",
    "DE",
    "EL",
    "ES",
    "ET",
    "FI",
    "FR",
    "HU",
    "ID",
    "IT",
    "JA",
    "KO",
    "LT",
    "LV",
    "NB",
    "NL",
    "PL",
    "PT",
    "RO",
    "RU",
    "SK",
    "SL",
    "SV",
    "TR",
    "UK",
    "ZH",
    "ZH-HANT",
  ]),
  kagiSessionLink: z.union([z.literal(""), z.url()]),
});
type Schema = z.infer<typeof schema>;

const store = useUserSettingsStore();

const model = ref<Schema>({
  kagiLanguage: options.find((o) => o.value === store.userSettings?.kagiLanguage)?.value ?? defaultOption.value,
  kagiSessionLink: store.userSettings?.kagiSessionLink ?? "",
});
const enabled = computed(() => !!model.value.kagiSessionLink?.trim());
const errors = ref({
  kagiLanguage: "",
  kagiSessionLink: "",
});
const error = computed(() => Object.values(errors.value).some((msg) => !!msg));

const pending = ref(false);
async function onSubmit() {
  errors.value = {
    kagiLanguage: "",
    kagiSessionLink: "",
  };

  pending.value = true;
  try {
    const result = schema.safeParse(model.value);
    if (!result.success) {
      const fieldErrors = z.flattenError(result.error).fieldErrors;
      errors.value = {
        kagiLanguage: fieldErrors.kagiLanguage?.join(", ") ?? "",
        kagiSessionLink: fieldErrors.kagiSessionLink?.join(", ") ?? "",
      };
      return;
    }
    const parsed = result.data;

    await $fetch("/api/user-settings", {
      method: "PATCH",
      body: {
        kagiLanguage: parsed.kagiLanguage,
        kagiSessionLink: parsed.kagiSessionLink,
      },
    });
    errors.value = {
      kagiLanguage: "",
      kagiSessionLink: "",
    };
    $q.notify({
      type: "positive",
      message: "Kagi Summarizer settings saved successfully",
    });
    store.load();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to save Kagi Summarizer settings: ${err}`,
    });
  } finally {
    pending.value = false;
  }
}
</script>
