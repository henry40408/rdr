<template>
  <q-expansion-item expand-icon-toggle :group="`category-${category.id}:feeds`">
    <template #header>
      <q-item-section side>
        <q-avatar v-if="feed.imageExists" square size="xs">
          <img :src="`/api/images/external/${buildFeedImageKey(feed.id)}`" />
        </q-avatar>
        <q-icon v-else size="xs" name="rss_feed" />
      </q-item-section>
      <q-item-section>
        <q-item-label>{{ feed.title }}</q-item-label>
      </q-item-section>
      <q-item-section side>
        <UnreadCount :count="feed.unreadCount" />
      </q-item-section>
      <q-item-section side>
        <q-btn
          flat
          round
          replace
          icon="search"
          :href="$router.resolve({ name: 'index', query: { categoryId: category.id, feedId: feed.id } }).href"
        />
      </q-item-section>
    </template>

    <q-list padding>
      <q-item>
        <q-item-section>
          <q-item-label caption>Fetched at</q-item-label>
          <q-item-label>
            <TimeAgo v-if="feed.fetchedAt" :datetime="feed.fetchedAt" />
            <q-badge v-else label="N/A" />
          </q-item-label>
        </q-item-section>
        <q-item-section>
          <q-item-label caption>Feed updated at</q-item-label>
          <q-item-label>
            <TimeAgo v-if="feed.feedUpdatedAt" :datetime="feed.feedUpdatedAt" />
            <q-badge v-else label="N/A" />
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label caption>Title</q-item-label>
          <q-item-label>{{ feed.title }}</q-item-label>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label caption>HTML URL</q-item-label>
          <q-item-label>
            <ExternalLink :href="feed.htmlUrl">{{ feed.htmlUrl }}</ExternalLink>
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label caption>XML URL</q-item-label>
          <q-item-label>{{ feed.xmlUrl }}</q-item-label>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label caption>Error count</q-item-label>
          <q-item-label>{{ feed.errorCount }}</q-item-label>
        </q-item-section>
        <q-item-section>
          <q-item-label caption>Last error</q-item-label>
          <q-item-label>
            <span v-if="feed.lastError">{{ feed.lastError }}</span>
            <q-badge v-else label="N/A" />
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label caption>Disable HTTP/2</q-item-label>
          <q-item-label>
            <q-badge :label="feed.disableHttp2 ? 'Yes' : 'No'" :color="feed.disableHttp2 ? 'positive' : 'dark'" />
          </q-item-label>
        </q-item-section>
        <q-item-section>
          <q-item-label caption>User Agent</q-item-label>
          <q-item-label>
            <span v-if="feed.userAgent">{{ feed.userAgent }}</span>
            <q-badge v-else label="N/A" />
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-expansion-item>
</template>

<script setup lang="ts">
defineProps<{
  feed: {
    disableHttp2: boolean;
    errorCount: number;
    feedUpdatedAt?: string;
    fetchedAt?: string;
    htmlUrl: string;
    id: number;
    imageExists: boolean;
    lastError?: string;
    title: string;
    unreadCount: number;
    userAgent?: string;
    xmlUrl: string;
  };
  category: {
    id: number;
    name: string;
  };
}>();
</script>
