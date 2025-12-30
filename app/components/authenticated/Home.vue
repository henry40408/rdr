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
          v-model="entryStore.search"
          dark
          dense
          filled
          debounce="500"
          input-class="text-right"
          placeholder="Search entries"
        >
          <template #append>
            <q-icon v-if="!entryStore.search" name="search" />
            <q-icon v-else name="clear" class="cursor-pointer" @click="entryStore.search = ''" />
          </template>
        </q-input>
        <NavTabs />
        <q-btn flat dense round icon="menu" @click="rightDrawerOpen = !rightDrawerOpen" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered persistent side="left" show-if-above>
      <HomeCategoryListFilters />
      <HomeCategoryList />
    </q-drawer>

    <q-drawer v-model="rightDrawerOpen" bordered persistent side="right" show-if-above>
      <VersionInfo />
      <q-separator />
      <UserInfo />
      <q-separator />
      <HomeEntryListFilters />
    </q-drawer>

    <q-page-container>
      <q-page>
        <q-list>
          <q-item>
            <q-item-section>
              <div class="row items-center q-gutter-xs">
                <HomeEntryListHeader />
                <div>
                  <HomeSelectedCategory />
                  <HomeSelectedFeed />
                </div>
              </div>
            </q-item-section>
            <q-item-section side>
              <UnreadCount :count="entryStore.count" />
            </q-item-section>
          </q-item>
        </q-list>
        <HomeEntryList />
        <HomeFloatingButton />
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

const categoryStore = useCategoryStore();
const entryStore = useEntryStore();
const userSettingsStore = useUserSettingsStore();

const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);

const title = computed(() => `(${entryStore.count > 999 ? "999+" : entryStore.count}) rdr`);
useHead({ title });

await Promise.all([categoryStore.load(), entryStore.firstLoad(), userSettingsStore.load()]);
</script>

<style>
@import "~/assets/css/anchor.css";
@import "~/assets/css/entry-content.css";
@import "~/assets/css/entry-summary.css";
</style>
