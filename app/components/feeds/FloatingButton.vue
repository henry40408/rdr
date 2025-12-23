<template>
  <q-page-sticky :offset="[16, 16]" position="bottom-right">
    <q-btn fab icon="add" color="primary" @click="$router.replace({ hash: '#new-feed' })" />
  </q-page-sticky>
</template>
