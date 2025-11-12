<template>
  <q-layout v-if="loggedIn" view="hhh LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />
        <q-toolbar-title>
          <q-avatar>
            <q-icon name="rss_feed" />
          </q-avatar>
          rdr
        </q-toolbar-title>
        <NavTabs />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered persistent side="left" show-if-above>
      <q-list padding>
        <q-item>
          <q-item-section>Navigation</q-item-section>
        </q-item>
        <q-item clickable @click="$router.push({ hash: '#change-password' })">
          <q-item-section>Change Password</q-item-section>
        </q-item>
        <q-item clickable @click="$router.push({ hash: '#user-settings' })">
          <q-item-section>User Settings</q-item-section>
        </q-item>
        <q-item clickable @click="$router.push({ hash: '#background-jobs' })">
          <q-item-section>Background Jobs</q-item-section>
        </q-item>
        <q-separator spaced />
      </q-list>
    </q-drawer>

    <q-page-container>
      <q-page>
        <q-list padding>
          <q-item id="change-password">
            <q-item-section>Change Password</q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <ChangePasswordForm />
            </q-item-section>
          </q-item>
          <q-separator spaced />
          <q-item id="user-settings">
            <q-item-section>User Settings</q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <UserSettingsForm />
            </q-item-section>
          </q-item>
          <q-separator spaced />
          <q-item id="background-jobs">
            <q-item-section>Background Jobs</q-item-section>
          </q-item>
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
        </q-list>
      </q-page>
    </q-page-container>
  </q-layout>
  <LoginPage v-else />
</template>

<script setup lang="ts">
import { millisecondsToSeconds } from "date-fns";
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

const leftDrawerOpen = ref(false);
const triggeringJobs = ref(new Set());

const headers = useRequestHeaders(["cookie"]);
const { data: jobsData, refresh: refreshJobs } = await useFetch("/api/jobs", { headers });

const jobPaused = computed(() => {
  const map: Record<string, boolean> = {};
  if (jobsData.value) for (const job of jobsData.value) map[job.name] = !!job.pausedAt;
  return map;
});

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
