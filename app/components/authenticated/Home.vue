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

    <q-drawer v-model="leftDrawerOpen" bordered persistent side="left" show-if-above></q-drawer>

    <q-drawer v-model="rightDrawerOpen" bordered persistent side="right" show-if-above></q-drawer>

    <q-page-container>
      <q-page></q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);
</script>
