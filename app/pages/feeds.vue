<template>
  <q-layout v-if="loggedIn" view="hhh LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          <q-avatar>
            <q-icon name="rss_feed" />
          </q-avatar>
          rdr
        </q-toolbar-title>
      </q-toolbar>
      <NavTabs />
    </q-header>

    <q-page-container>
      <q-page>
        <q-list padding>
          <q-item>
            <q-item-section>
              <q-item-label>Feeds</q-item-label>
              <q-item-label caption>Manage your feed subscriptions</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn flat round icon="refresh" :loading="refreshingCategoryIds.size > 0" @click="refreshAll">
                <q-tooltip self="center right" anchor="center left">Refresh all</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-toggle v-model="hideEmpty" label="Hide empty" />
              <q-toggle v-model="showErrorOnly" label="Show error only" />
            </q-item-section>
          </q-item>
          <template v-for="category in filteredCategories" :key="category.id">
            <q-expansion-item group="category">
              <template #header>
                <q-item-section
                  v-ripple
                  clickable
                  @click="() => $router.push({ path: '/', query: { categoryId: category.id } })"
                >
                  <q-item-label>{{ category.name }}</q-item-label>
                </q-item-section>
                <q-item-section top side>
                  <q-item-label caption>{{ category.feeds.length }} feeds</q-item-label>
                  <div class="q-mt-xs">
                    <q-badge color="primary" :outline="!categoryUnreadCount(category.id)">{{
                      categoryUnreadCount(category.id)
                    }}</q-badge>
                  </div>
                </q-item-section>
              </template>

              <q-card>
                <q-card-section class="row items-center q-gutter-sm">
                  <q-btn
                    icon="refresh"
                    color="primary"
                    label="Refresh"
                    :loading="refreshingCategoryIds.has(category.id)"
                    @click="refreshCategory(category)"
                  />
                </q-card-section>
              </q-card>
            </q-expansion-item>
            <q-list separator>
              <template v-for="feed in category.feeds" :key="feed.id">
                <q-expansion-item expand-icon-toggle :group="`category-${category.id}`">
                  <template #header>
                    <q-item-section avatar>
                      <q-avatar v-if="imageExists(feed.id)" square>
                        <img
                          loading="lazy"
                          alt="Feed image"
                          decoding="async"
                          :class="{ 'bg-white': isDark }"
                          :src="`/api/images/external/${buildFeedImageKey(feed.id)}`"
                        />
                      </q-avatar>
                      <q-icon v-else name="rss_feed" class="feed-image" />
                    </q-item-section>
                    <q-item-section
                      v-ripple
                      clickable
                      @click="() => $router.push({ path: '/', query: { feedId: feed.id } })"
                    >
                      <q-item-label lines="1">
                        <span
                          :class="{
                            'text-negative': feedDataByFeedId[feed.id]?.lastError,
                          }"
                          >{{ feed.title }}</span
                        >
                      </q-item-label>
                    </q-item-section>
                    <q-item-section top side>
                      <q-item-label caption>{{ formatFetchedAtToNow(feed.id) }}</q-item-label>
                      <div class="q-mt-xs">
                        <q-badge color="primary" :outline="!feedUnreadCount(feed.id)">{{
                          feedUnreadCount(feed.id)
                        }}</q-badge>
                      </div>
                    </q-item-section>
                  </template>

                  <q-list padding>
                    <q-item>
                      <q-item-section>
                        <q-item-label overline>LAST ERROR</q-item-label>
                        <q-item-label>{{ feedDataByFeedId[feed.id]?.lastError || "-" }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <div>
                          <q-btn-group push>
                            <q-btn
                              icon="refresh"
                              label="Refresh"
                              :loading="refreshingFeedIds.has(feed.id)"
                              @click="refreshFeed(feed)"
                            />
                            <q-btn
                              target="_blank"
                              icon="open_in_new"
                              :href="feed.htmlUrl"
                              label="Go to website"
                              rel="noopener noreferrer"
                            />
                          </q-btn-group>
                        </div>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-expansion-item>
              </template>
            </q-list>
          </template>
        </q-list>
        <q-banner v-if="filteredCategories.length <= 0" :class="{ 'bg-grey-9': isDark, 'bg-grey-3': !isDark }">
          <template #avatar>
            <q-icon name="info" />
          </template>

          <div>No categories found</div>
          <div class="text-caption">
            Try adjusting your filters or
            <router-link to="/settings">add new feeds</router-link>.
          </div>
        </q-banner>
      </q-page>
    </q-page-container>
  </q-layout>
  <LoginPage v-else />
</template>

<script setup>
import { formatDistanceToNow } from "date-fns";
import { useQuasar } from "quasar";

const requestFetch = useRequestFetch();
const { loggedIn } = useUserSession();

const $q = useQuasar();
const isDark = useDark();
onMounted(() => {
  $q.dark.set(isDark.value);
});
watchEffect(
  () => {
    if (isDark.value !== $q.dark.isActive) $q.dark.set(isDark.value);
  },
  { flush: "post" },
);

const { hideEmpty } = useLocalSettings();

/** @type {Ref<Set<number>>} */
const refreshingCategoryIds = ref(new Set());
/** @type {Ref<Set<number>>} */
const refreshingFeedIds = ref(new Set());
/** @type {Ref<boolean>} */
const showErrorOnly = ref(false);

const { data: categories, execute: refreshCategories } = await useFetch("/api/categories");
const { data: feedData, execute: refreshFeedData } = await useFetch("/api/feeds/data");

const feedDataByFeedId = computed(() => feedData.value?.feeds ?? {});
const filteredCategories = computed(() => {
  let original = structuredClone(categories.value ?? []);

  for (const category of original)
    category.feeds = category.feeds.filter((feed) => {
      if (showErrorOnly.value) return !!feedDataByFeedId.value[feed.id]?.lastError;
      if (!hideEmpty.value) return true;
      return feedDataByFeedId.value[feed.id]?.unreadCount ?? 0;
    });

  original = original.filter((category) => category.feeds.length > 0);
  return original;
});

async function afterRefresh() {
  await Promise.all([refreshCategories(), refreshFeedData()]);
}

/**
 * @param {number} categoryId
 * @returns {number}
 */
function categoryUnreadCount(categoryId) {
  const category = categories.value?.find((c) => c.id === categoryId);
  if (!category) return 0;
  return category.feeds.reduce((sum, feed) => {
    const feedData = feedDataByFeedId.value[feed.id];
    return sum + (feedData?.unreadCount ?? 0);
  }, 0);
}

/**
 * @param {number} feedId
 * @returns {number}
 */
function feedUnreadCount(feedId) {
  return feedDataByFeedId.value[feedId]?.unreadCount ?? 0;
}

/**
 * @param {number} feedId
 * @returns {string}
 */
function formatFetchedAtToNow(feedId) {
  const fetchedAt = feedData.value?.feeds[feedId]?.fetchedAt;
  if (!fetchedAt) return "never";
  return formatDistanceToNow(new Date(fetchedAt), { addSuffix: true });
}

/**
 * @param {number} feedId
 * @returns {boolean}
 */
function imageExists(feedId) {
  return feedData.value?.feeds[feedId]?.imageExists ?? false;
}

async function refreshAll() {
  if (refreshingCategoryIds.value.size > 0) return;
  if (!categories.value) return;

  const tasks = [];
  for (const category of categories.value) tasks.push(refreshCategory(category));
  await Promise.allSettled(tasks);
}

/**
 * @param {CategoryEntity} category
 */
async function refreshCategory(category) {
  const feedIds = category.feeds.map((feed) => feed.id);

  refreshingCategoryIds.value.add(category.id);
  for (const feedId of feedIds) refreshingFeedIds.value.add(feedId);

  try {
    const tasks = [];
    for (const feedId of feedIds) tasks.push(requestFetch(`/api/feeds/${feedId}/refresh`, { method: "POST" }));
    await Promise.all(tasks);
    await afterRefresh();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Error refreshing category ${category.name}: ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
  } finally {
    for (const feedId of feedIds) refreshingFeedIds.value.delete(feedId);
    refreshingCategoryIds.value.delete(category.id);
  }
}

/**
 * @param {FeedEntity} feed
 */
async function refreshFeed(feed) {
  if (refreshingFeedIds.value.has(feed.id)) return;
  refreshingFeedIds.value.add(feed.id);
  try {
    await requestFetch(`/api/feeds/${feed.id}/refresh`, { method: "POST" });
    await afterRefresh();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Error refreshing feed ${feed.title}: ${err}`,
      actions: [{ icon: "close", color: "white" }],
    });
  } finally {
    refreshingFeedIds.value.delete(feed.id);
  }
}
</script>
