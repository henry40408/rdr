<template>
  <q-page-sticky :offset="[16, 16]" position="bottom-right">
    <template v-if="expanded">
      <div class="column q-gutter-md">
        <q-btn fab :icon="starIcon" color="secondary" :loading="starring" @click="toggleExpandedStar()" />
        <q-btn fab :icon="readIcon" color="secondary" :loading="reading" @click="toggleExpandedRead()" />
        <q-btn fab icon="close" color="primary" @click="closeExpanded()" />
      </div>
    </template>
    <template v-else>
      <ClientOnly>
        <q-btn v-if="hasUnreadItems" fab color="primary" icon="done_all" @click="markAllAsRead()" />
      </ClientOnly>
    </template>
  </q-page-sticky>
</template>

<script setup lang="ts">
const $q = useQuasar();

const store = useEntryStore();

const expanded = computed(() => Object.values(store.expands).some((v) => v));
const hasUnreadItems = computed(() => Object.values(store.entryReads).some((s) => s === "unread"));
const reading = computed(() => store.expandedRead === "reading");
const readIcon = computed(() => (store.expandedRead === "read" ? "drafts" : "mail"));
const starring = computed(() => store.expandedStarred === "starring");
const starIcon = computed(() => (store.expandedStarred === "starred" ? "star" : "star_border"));

function closeExpanded() {
  const expandedEntryId = store.expandedEntryId;
  if (!expandedEntryId) return;
  eventBus.emit(buildEventToScrollToEntry(expandedEntryId));
  store.setExpand(expandedEntryId, false);
}

function markAllAsRead() {
  $q.dialog({
    title: "Mark All as Read",
    message: "Are you sure you want to mark all entries as read?",
    options: {
      type: "radio",
      model: "all",
      items: [
        { label: store.filtered ? "Filtered" : "All", value: "all" },
        { label: "Older than a day", value: "day" },
        { label: "Older than a week", value: "week" },
        { label: "Older than a month", value: "month" },
        { label: "Older than a year", value: "year" },
      ],
    },
    cancel: true,
    ok: { color: "negative" },
  }).onOk(async (olderThan) => {
    if (olderThan === "all") {
      const latestItem = store.latestItem;
      if (!latestItem) return;
      const updated = await store.markAllAsRead({ before: latestItem.entry.date });
      $q.notify({
        type: "positive",
        message: `${updated} entries marked as read.`,
        actions: [{ icon: "close", color: "white" }],
      });
    } else {
      const updated = await store.markAllAsRead({ olderThan });
      $q.notify({
        type: "positive",
        message: `${updated} entries older than ${olderThan} marked as read.`,
        actions: [{ icon: "close", color: "white" }],
      });
    }
  });
}

async function toggleExpandedRead() {
  const expandedEntryId = store.expandedEntryId;
  if (!expandedEntryId) return;

  const previous = store.entryReads[expandedEntryId];
  if (!previous || previous === "reading") return;

  const value = previous === "read" ? "unread" : "read";
  await store.setExpandedRead(value);

  if (value === "read") {
    store.setExpand(expandedEntryId, false);
    eventBus.emit(buildEventToScrollToEntry(expandedEntryId));
  }
}

async function toggleExpandedStar() {
  const expandedEntryId = store.expandedEntryId;
  if (!expandedEntryId) return;

  const previous = store.entryStars[expandedEntryId];
  if (!previous || previous === "starring") return;

  const value = previous === "starred" ? "unstarred" : "starred";
  await store.setExpandedStar(value);
}
</script>
