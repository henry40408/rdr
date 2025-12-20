<template>
  <q-expansion-item group="category" expand-icon-toggle>
    <template #header>
      <q-item-section side>
        <q-icon size="xs" name="category" />
      </q-item-section>
      <q-item-section>
        <q-item-label>{{ category.name }}</q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-btn
          flat
          round
          replace
          icon="search"
          :href="$router.resolve({ name: 'index', query: { categoryId: category.id } }).href"
        />
      </q-item-section>
    </template>

    <q-list padding>
      <q-item>
        <q-item-section>
          <q-item-label caption>Name</q-item-label>
          <q-item-label>{{ category.name }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-expansion-item>
  <FeedsFeedList :category="category" :feeds="category.feeds" />
  <q-separator spaced />
</template>

<script setup lang="ts">
defineProps<{
  category: {
    id: number;
    name: string;
    feeds: {
      disableHttp2: boolean;
      errorCount: number;
      feedUpdatedAt?: string;
      fetchedAt?: string;
      htmlUrl: string;
      id: number;
      imageExists: boolean;
      lastError?: string;
      title: string;
      userAgent?: string;
      xmlUrl: string;
    }[];
  };
}>();
</script>
