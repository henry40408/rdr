<template>
  <q-form class="q-gutter-md" @submit="onSubmit">
    <q-input
      v-model="kagiSessionLink"
      filled
      label="Kagi session link"
      hint="Enter your Kagi session link to enable summarization features."
    />
    <q-select v-model="kagiLanguage" filled emit-value map-options label="Target Language" :options="languageOptions" />
    <q-btn label="Save" type="submit" color="primary" />
  </q-form>
</template>

<script setup>
import { useQuasar } from "quasar";

const languageOptions = [
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

const userSettings = useUserSettings();

const kagiSessionLink = ref("");
const kagiLanguage = ref("EN");
watchEffect(
  () => {
    if (!userSettings.value) return;
    kagiLanguage.value = userSettings.value.kagiLanguage || "EN";
    kagiSessionLink.value = userSettings.value.kagiSessionLink || "";
  },
  { flush: "post" },
);

async function onSubmit() {
  if (!userSettings.value) return;

  userSettings.value.kagiLanguage = kagiLanguage.value;
  userSettings.value.kagiSessionLink = kagiSessionLink.value;

  $q.notify({
    message: "Settings saved",
    color: "positive",
    actions: [{ label: "OK", color: "white" }],
  });
}
</script>
