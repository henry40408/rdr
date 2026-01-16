<template>
  <div class="space-x-2 text-xs md:text-base">
    <input id="showErrorFeeds" v-model="store.showErrorOnly" type="checkbox" />
    <label for="showErrorFeeds">Show Error Feeds Only</label>
  </div>
  <div>
    <form class="text-xs space-x-2 md:text-base" @submit.prevent="importOpml">
      <input id="opmlFile" name="file" type="file" accept=".opml,.xml" class="bg-gray-200 dark:bg-gray-700 p-1" />
      <XButton type="submit" :pending="importing">Import</XButton>
      <a download href="/api/opml">Export</a>
    </form>
  </div>
</template>

<script setup lang="ts">
const store = useCategoryStore();

const importing = ref(false);
async function importOpml(event: Event) {
  const form = event.target as HTMLFormElement;
  const formData = new FormData(form);
  importing.value = true;
  try {
    await fetch("/api/opml", { method: "POST", body: formData });
    await store.load();
  } finally {
    importing.value = false;
  }
}
</script>
