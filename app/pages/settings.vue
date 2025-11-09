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
        <NavTabs />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page>
        <q-list padding>
          <q-item-label header>Subscriptions</q-item-label>
          <q-item>
            <q-item-section>
              <q-file v-model="uploadedFile" label="Upload OPML">
                <template #prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
            </q-item-section>
            <q-item-section side>
              <q-btn
                label="Import"
                class="q-ml-sm"
                color="primary"
                :loading="uploading"
                :disabled="!uploadedFile"
                @click="importOPML"
              />
            </q-item-section>
            <q-item-section side>
              <q-btn label="Export" color="primary" href="/api/opml" />
            </q-item-section>
          </q-item>
          <q-separator spaced />
          <q-item-label header>Background Jobs</q-item-label>
          <q-item v-for="job in jobsData" :key="job.name">
            <q-item-section side>
              <JobToggle :name="job.name" :value="!!jobPaused[job.name]" @toggled="refreshJobs()" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ job.name }}</q-item-label>
              <q-item-label caption>{{ job.description }}</q-item-label>
              <q-item-label caption>
                <span v-if="job.pausedAt">
                  <q-icon name="pause" />
                  Paused at: <ClientDateTime :datetime="job.pausedAt" />
                </span>
                <span v-else><q-icon name="check" /> Not paused</span>,
                <span>
                  Last run:
                  <ClientDateTime v-if="job.lastDate" :datetime="job.lastDate" />
                  <span v-else>Never</span> </span
                >,
                <span>
                  Last duration: {{ job.lastDurationMs ? `${millisecondsToSeconds(job.lastDurationMs)}s` : "-" }} </span
                >,
                <span>Last error: {{ job.lastError ? job.lastError : "-" }}</span>
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
          <q-item v-if="jobsData?.length === 0">
            <q-item-section>
              <q-item-label>No background jobs available.</q-item-label>
            </q-item-section>
          </q-item>
          <q-separator spaced />
          <q-item-label header>Change Password</q-item-label>
          <q-item>
            <q-item-section>
              <ChangePasswordForm />
            </q-item-section>
          </q-item>
          <q-separator spaced />
          <q-item-label header>User Settings</q-item-label>
          <q-item>
            <q-item-section>
              <UserSettingsForm />
            </q-item-section>
          </q-item>
        </q-list>
      </q-page>
    </q-page-container>
  </q-layout>
  <LoginPage v-else />
</template>

<script setup lang="ts">
import { millisecondsToSeconds } from "date-fns/millisecondsToSeconds";
import { useQuasar } from "quasar";

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

const triggeringJobs = ref(new Set());
const uploadedFile = ref(null);
const uploading = ref(false);

const headers = useRequestHeaders(["cookie"]);
const { data: jobsData, refresh: refreshJobs } = await useFetch("/api/jobs", { headers });

const jobPaused = computed(() => {
  const map: Record<string, boolean> = {};
  if (jobsData.value) for (const job of jobsData.value) map[job.name] = !!job.pausedAt;
  return map;
});

async function importOPML() {
  if (!uploadedFile.value) return;
  const formData = new FormData();
  formData.append("file", uploadedFile.value);

  if (uploading.value) return;
  uploading.value = true;

  try {
    await $fetch("/api/opml", { method: "POST", body: formData });
    uploadedFile.value = null;
    $q.notify({
      type: "positive",
      message: "OPML file imported successfully",
    });
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to import OPML file: ${err}`,
    });
  } finally {
    uploading.value = false;
  }
}

async function triggerJob(name: string) {
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
