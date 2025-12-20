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
        <NavTabs />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered persistent side="left" show-if-above>
      <FeedsSideCategoryList />
    </q-drawer>

    <q-page-container>
      <q-page>
        <FeedsCategoryList />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
const $q = useQuasar();

const colorMode = useColorMode();
onMounted(() => {
  $q.dark.set(colorMode.value === "dark");
  watchEffect(() => {
    $q.dark.set(colorMode.value === "dark");
  });
});

const leftDrawerOpen = ref(false);
</script>
