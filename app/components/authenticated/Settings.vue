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
      <UserInfo />
    </q-drawer>

    <q-page-container>
      <q-page>
        <q-list padding>
          <q-item-label header>System Settings</q-item-label>
          <q-item>
            <q-item-section>
              <q-item-label caption>Error threshold</q-item-label>
              <q-item-label>{{ systemSettingsStore.config.errorThreshold }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label caption>HTTP request timeout</q-item-label>
              <q-item-label>{{ systemSettingsStore.config.httpTimeoutMs }}ms</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label caption>User agent</q-item-label>
              <q-item-label>{{ systemSettingsStore.config.userAgent }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
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

const systemSettingsStore = useSystemSettingsStore();

const leftDrawerOpen = ref(false);
</script>
