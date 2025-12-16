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
        <q-btn flat dense round icon="menu" @click="rightDrawerOpen = !rightDrawerOpen" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered persistent side="left" show-if-above>
      <HomeCategoryListFilters />
      <HomeCategoryList />
    </q-drawer>

    <q-drawer v-model="rightDrawerOpen" bordered persistent side="right" show-if-above>
      <HomeEntryListFilters />
    </q-drawer>

    <q-page-container>
      <q-page>
        <q-list padding>
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
              <UnreadCount :count="storeE.count" />
            </q-item-section>
          </q-item>
        </q-list>
        <HomeEntryList />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);

const storeC = useCategoryStore();
const storeE = useEntryStore();
await storeC.loadCategories();
await storeE.loadEntries();
</script>
