<template>
  <q-list>
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
</template>

<script setup lang="ts">
const systemSettingsStore = useSystemSettingsStore();
</script>
