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
        <q-item clickable href="#passkeys">
          <q-item-section>
            <q-item-label>WebAuthn (Passkeys)</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable href="#change-password">
          <q-item-section>
            <q-item-label>Change password</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable href="#system-settings">
          <q-item-section>
            <q-item-label>System settings</q-item-label>
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item-label header>Integrations</q-item-label>
        <q-item clickable href="#integration-kagi-summarizer">
          <q-item-section>
            <q-item-label>Kagi summarizer</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable href="#integration-linkding">
          <q-item-section>
            <q-item-label>Linkding</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
      <q-separator />
      <UserInfo />
    </q-drawer>

    <q-page-container>
      <q-page>
        <SettingsPasskeyList id="passkeys" />
        <q-separator />
        <SettingsChangePasswordForm id="change-password" />
        <q-separator />
        <SettingsSystemSettings id="system-settings" />
        <q-separator />
        <SettingsIntegrationForm />
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

const featureStore = useFeatureStore();
const passkeyStore = usePasskeyStore();
const systemSettingsStore = useSystemSettingsStore();

const leftDrawerOpen = ref(false);

await Promise.all([featureStore.load(), passkeyStore.load(), systemSettingsStore.load()]);
</script>
