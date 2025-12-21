<template>
  <q-layout view="hhh LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />
        <q-toolbar-title>
          <q-avatar>
            <q-icon name="rss_feed" />
          </q-avatar>
          rdr
        </q-toolbar-title>
        <q-input
          v-model="store.keyword"
          dark
          dense
          filled
          debounce="500"
          input-class="text-right"
          placeholder="Search categories / feeds"
        >
          <template #append>
            <q-icon v-if="!store.keyword" name="search" />
            <q-icon v-else name="clear" class="cursor-pointer" @click="store.keyword = ''" />
          </template>
        </q-input>
        <NavTabs />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered persistent side="left" show-if-above>
      <FeedsSideCategoryList />
    </q-drawer>

    <q-page-container>
      <q-page class="q-pb-xl">
        <FeedsNewFeedForm id="new-feed" />
        <q-separator spaced />
        <FeedsCategoryList />
        <FeedsFloatingButton />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
const $q = useQuasar();

useHead({
  title: "Feeds - rdr",
});

const colorMode = useColorMode();
onMounted(() => {
  $q.dark.set(colorMode.value === "dark");
  watchEffect(() => {
    $q.dark.set(colorMode.value === "dark");
  });
});

const store = useCategoryStore();

const leftDrawerOpen = ref(false);

await store.load();
</script>
