<template>
  <q-list>
    <q-item-label header>Version</q-item-label>
    <q-item>
      <q-item-section>
        <q-item-label caption>Version</q-item-label>
        <q-item-label>{{ $config.public.version }}</q-item-label>
      </q-item-section>
    </q-item>
    <q-item>
      <q-item-section>
        <q-item-label caption>Build date</q-item-label>
        <q-item-label>
          <DateTime :datetime="$config.public.buildDate" />
        </q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>
