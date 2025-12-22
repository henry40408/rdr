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
      <q-list>
        <q-item-label header>Navigation</q-item-label>
        <q-item clickable href="#change-password">
          <q-item-section>
            <q-item-label>Change password</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable href="#passkeys">
          <q-item-section>
            <q-item-label>WebAuthn (Passkeys)</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable href="#system-settings">
          <q-item-section>
            <q-item-label>System settings</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
      <q-separator spaced />
      <UserInfo />
    </q-drawer>

    <q-page-container>
      <q-page>
        <SettingsChangePasswordForm id="change-password" />
        <q-separator spaced />
        <SettingsPasskeyList id="passkeys" />
        <q-separator spaced />
        <SettingsSystemSettings id="system-settings" />
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

const passkeyStore = usePasskeyStore();
const systemSettingsStore = useSystemSettingsStore();

const leftDrawerOpen = ref(false);

await systemSettingsStore.load();
await passkeyStore.load();
</script>
