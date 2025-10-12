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
      <NavTabs />
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
          <q-item>
            <q-file v-model="uploadedFile" label="Upload OPML">
              <template #prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>
            <q-btn
              size="sm"
              label="Import"
              class="q-ml-sm"
              color="primary"
              :disabled="!uploadedFile"
              @click="importOPML"
            />
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
              <q-item-label>{{ job.name }}</q-item-label>
              <q-item-label caption>{{ job.description }}</q-item-label>
              <q-item-label caption>
                Last run:
                <ClientDateTime v-if="job.lastDate" :datetime="job.lastDate" />
                <span v-else>Never</span>, Last duration:
                {{ job.lastDurationMs ? `${millisecondsToSeconds(job.lastDurationMs)}s` : "-" }}
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
                <q-tooltip self="center right" anchor="center left">Run job</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
        </q-list>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { millisecondsToSeconds } from "date-fns";
import { useQuasar } from "quasar";

const $q = useQuasar();

const triggeringJobs = ref(new Set());
const uploadedFile = ref(null);

const { data: jobsData } = await useFetch("/api/jobs");

async function importOPML() {
  if (!uploadedFile.value) return;
  const formData = new FormData();
  formData.append("file", uploadedFile.value);
  try {
    await $fetch("/api/opml", { method: "POST", body: formData });
    $q.notify({
      type: "positive",
      message: "OPML file imported successfully",
    });
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to import OPML file: ${err}`,
    });
  }
}

/**
 * @param {string} name
 */
async function triggerJob(name) {
  if (triggeringJobs.value.has(name)) return;
  triggeringJobs.value.add(name);
  try {
    await $fetch(`/api/jobs/${name}/run`, { method: "POST" });
    $q.notify({
      type: "positive",
      message: `Job ${name} triggered successfully`,
      actions: [{ label: "Close", color: "white" }],
    });
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
