<template>
  <q-form class="q-gutter-md" @submit="onSubmit">
    <div>
      <q-icon :name="features?.summarization ? 'check' : 'close'" />
      Kagi Summarization
    </div>
    <q-input
      v-model="kagiSessionLink"
      filled
      label="Kagi session link"
      hint="Enter your Kagi session link to enable summarization features."
    />
    <q-select
      v-model="kagiLanguage"
      filled
      emit-value
      map-options
      label="Target Language"
      :options="LANGUAGE_OPTIONS"
      hint="Select the target language for Kagi summarization."
    />
    <div>
      <q-icon :name="features?.linkding ? 'check' : 'close'" />
      Linkding Bookmarking
    </div>
    <q-input
      v-model="linkdingApiUrl"
      filled
      label="Linkding API URL"
      hint="Enter your Linkding API URL to enable bookmarking features."
    />
    <q-input
      v-model="linkdingApiToken"
      filled
      type="password"
      label="Linkding API Token"
      hint="Enter your Linkding API token to enable bookmarking features."
    />
    <q-select
      v-model="linkdingDefaultTags"
      filled
      multiple
      use-chips
      use-input
      label="Default Tags"
      new-value-mode="add-unique"
      hint="Select default tags to apply to new bookmarks."
    />
    <q-btn label="Save" type="submit" color="primary" />
  </q-form>
</template>

<script setup lang="ts">
import { useQuasar } from "quasar";

const LANGUAGE_OPTIONS = [
  { label: "English", value: "EN" },
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
];

const $q = useQuasar();

const { data: features, refresh: refreshFeatures } = useFeatures();
const { data: userSettings, update: updateUserSettings } = useUserSettings();

const kagiSessionLink = ref("");
const kagiLanguage = ref("EN");
const linkdingApiUrl = ref("");
const linkdingApiToken = ref("");
const linkdingDefaultTags = ref([]);
watchEffect(
  () => {
    if (!userSettings.value) return;
    kagiLanguage.value = userSettings.value.kagiLanguage ?? "EN";
    kagiSessionLink.value = userSettings.value.kagiSessionLink ?? "";
    linkdingApiUrl.value = userSettings.value.linkdingApiUrl ?? "";
    linkdingApiToken.value = userSettings.value.linkdingApiToken ?? "";
    linkdingDefaultTags.value = JSON.parse(userSettings.value.linkdingDefaultTags ?? "[]") ?? [];
  },
  { flush: "post" },
);

async function onSubmit() {
  try {
    if (!userSettings.value) return;
    await updateUserSettings({
      kagiLanguage: kagiLanguage.value,
      kagiSessionLink: kagiSessionLink.value,
      linkdingApiUrl: linkdingApiUrl.value,
      linkdingApiToken: linkdingApiToken.value,
      linkdingDefaultTags: JSON.stringify(linkdingDefaultTags.value),
    });
    await refreshFeatures();
    $q.notify({
      message: "Settings saved",
      color: "positive",
      actions: [{ label: "OK", color: "white" }],
    });
  } catch {
    $q.notify({
      message: "Failed to save settings",
      color: "negative",
      actions: [{ label: "OK", color: "white" }],
    });
  }
}
</script>
