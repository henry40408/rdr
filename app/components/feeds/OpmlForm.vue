<template>
  <q-form @submit="importOpml()">
    <q-list>
      <q-item-label header>Import / export OPML</q-item-label>
      <q-item>
        <q-item-section>
          <q-file v-model="opmlFile" filled required color="primary" label="OPML file *" accept=".opml, .xml" />
        </q-item-section>
        <q-item-section side>
          <q-btn type="submit" label="Import" color="primary" :disable="!opmlFile" />
        </q-item-section>
        <q-item-section side>
          <q-btn type="submit" label="Export" color="primary" href="/api/opml" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-form>
</template>

<script setup lang="ts">
const $q = useQuasar();

const store = useCategoryStore();

const opmlFile = ref(undefined);

async function importOpml() {
  if (!opmlFile.value) return;
  try {
    const formData = new FormData();
    formData.append("file", opmlFile.value);
    await $fetch("/api/opml", { method: "POST", body: formData });
    opmlFile.value = undefined;
    $q.notify({ type: "positive", message: "OPML imported successfully" });
    store.load();
  } catch (err) {
    $q.notify({ type: "negative", message: `Failed to import OPML: ${err}` });
  }
}
</script>
