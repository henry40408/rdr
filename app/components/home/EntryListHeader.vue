<template>
  <q-list padding>
    <q-item>
      <q-item-section>
        <div>
          <span class="q-mr-sm">{{ statusLabel }}</span>
          <HomeSelectedCategory />
          <HomeSelectedFeed />
        </div>
      </q-item-section>
      <q-item-section side>
        <UnreadCount :count="count" />
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
const { count } = useEntryCount();
const { entryStatus } = useEntries();
const statusLabel = computed(() => STATUS.find((s) => s.value === entryStatus.value)?.label ?? DEFAULT_STATUS.label);
</script>
