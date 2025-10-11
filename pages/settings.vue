<template>
  <q-layout view="hhh LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          <q-avatar>
            <q-icon name="rss_feed" />
          </q-avatar>
          rdr
        </q-toolbar-title>
      </q-toolbar>
      <Nav />
    </q-header>

    <q-page-container>
      <q-page>
        <q-list padding>
          <q-item>
            <q-item-section header>
              <q-item-label class="text-h5">Subscriptions</q-item-label>
              <q-item-label caption>Manage your subscriptions</q-item-label>
            </q-item-section>
          </q-item>
          <q-item href="/api/opml">
            <q-item-section>
              <q-item-label>Export OPML</q-item-label>
              <q-item-label caption>Export your feed subscriptions as an OPML file</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <q-list padding>
          <q-item>
            <q-item-section header>
              <q-item-label class="text-h5">Background Jobs</q-item-label>
              <q-item-label caption>Manually trigger background jobs</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-for="job in jobsData" :key="job.name">
            <q-item-section>
              <q-item-label>{{ job.description }}</q-item-label>
              <q-item-label caption
                >Last run:
                <ClientDateTime :datetime="job.lastDate" v-if="job.lastDate" />
                <span v-else>Never</span>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                flat
                round
                icon="play_arrow"
                :loading="triggeringJobs.has(job.name)"
                @click="() => triggerJob(job.name)"
              >
                <q-tooltip anchor="center left" self="center right">Run job</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
        </q-list>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useQuasar } from "quasar";

const $q = useQuasar();
const { data: jobsData } = await useFetch("/api/jobs");

const triggeringJobs = ref(new Set());

/**
 * @param {string} name
 */
async function triggerJob(name) {
  if (triggeringJobs.value.has(name)) return;
  triggeringJobs.value.add(name);
  try {
    await $fetch(`/api/jobs/${name}/run`, { method: "POST" });
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to trigger job: ${err}`,
      actions: [{ label: "Close", color: "white" }],
    });
  } finally {
    triggeringJobs.value.delete(name);
  }
}
</script>
