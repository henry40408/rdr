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
        <q-item-label header>Navigation</q-item-label>
        <q-item clickable @click="$router.push({ hash: '#webauthn' })">
          <q-item-section>WebAuthn (Passkey)</q-item-section>
        </q-item>
        <q-item clickable @click="$router.push({ hash: '#change-password' })">
          <q-item-section>Change Password</q-item-section>
        </q-item>
        <q-item clickable @click="$router.push({ hash: '#user-settings' })">
          <q-item-section>User Settings</q-item-section>
        </q-item>
        <q-separator spaced />
        <q-item-label header>Administration</q-item-label>
        <q-item clickable @click="$router.push({ hash: '#background-jobs' })">
          <q-item-section>Background Jobs</q-item-section>
        </q-item>
        <q-separator spaced />
        <q-item>
          <q-item-section>
            <q-btn label="Log Out" color="negative" @click="logout()" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <q-page>
        <q-list padding>
          <q-item id="webauthn">
            <q-item-section>WebAuthn (Passkey)</q-item-section>
          </q-item>
          <q-item>
            <q-btn color="primary" @click="onRegisterWebAuthn">Register WebAuthn Device</q-btn>
          </q-item>
          <q-item v-for="passkey in passkeys" :key="passkey.id">
            <q-item-section>
              <q-item-label>{{ passkey.displayName || passkey.credentialId }}</q-item-label>
              <q-item-label caption>Registered at: <ClientDateTime :datetime="passkey.createdAt" /></q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn flat icon="delete" @click="onDeletePasskey(passkey.id)" />
            </q-item-section>
          </q-item>
          <q-item v-if="passkeys?.length === 0" :class="{ 'q-pa-md': true, 'bg-grey-9': isDark, 'bg-grey-3': !isDark }">
            <q-item-section side>
              <q-icon name="info" />
            </q-item-section>
            <q-item-section>
              <q-item-label>No WebAuthn devices registered.</q-item-label>
            </q-item-section>
          </q-item>
          <q-separator spaced />
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

useHead({
  title: "Settings - rdr",
});

const { clear: logout, loggedIn, session } = useUserSession();
const { register: registerWebAuthn } = useWebAuthn();

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
const { data: passkeys, error: passkeysError, refresh: refreshPasskeys } = await useFetch("/api/passkeys", { headers });
const { data: jobsData, error: jobsError, refresh: refreshJobs } = await useFetch("/api/jobs", { headers });

watchEffect(() => {
  const isUnauthorized = [passkeysError.value, jobsError.value].some((err) => err?.statusCode === 401);
  if (isUnauthorized) logout();
});

const jobPaused = computed(() => {
  const map: Record<string, boolean> = {};
  if (jobsData.value) for (const job of jobsData.value) map[job.name] = !!job.pausedAt;
  return map;
});

function onDeletePasskey(id: number) {
  $q.dialog({
    title: "Delete Passkey",
    message: "Are you sure you want to delete this passkey? You will not be able to use it for authentication anymore.",
    cancel: true,
    ok: { color: "negative" },
  }).onOk(async () => {
    try {
      await $fetch(`/api/passkeys/${id}`, { method: "DELETE" });
      refreshPasskeys();
      $q.notify({
        type: "positive",
        message: "Passkey deleted successfully.",
        actions: [{ label: "Close", color: "white" }],
      });
    } catch (err) {
      $q.notify({
        type: "negative",
        message: `Failed to delete passkey: ${err}`,
        actions: [{ label: "Close", color: "white" }],
      });
    }
  });
}

function onRegisterWebAuthn() {
  const username = session.value?.user?.username;
  if (!username) return;

  $q.dialog({
    title: "Register WebAuthn Device",
    message:
      "Please ensure your WebAuthn device (e.g., security key or biometric authenticator) is connected and ready.",
    prompt: {
      model: "",
      type: "text",
      label: "Display Name (optional)",
      hint: "You can provide a name to identify this device later.",
    },
    cancel: true,
  }).onOk(async (displayName: string) => {
    try {
      await registerWebAuthn({ userName: username, displayName });
      refreshPasskeys();
      $q.notify({
        type: "positive",
        message: "WebAuthn registered successfully",
        actions: [{ label: "Close", color: "white" }],
      });
    } catch (err) {
      $q.notify({
        type: "negative",
        message: `Failed to register WebAuthn: ${err}`,
        actions: [{ label: "Close", color: "white" }],
      });
    }
  });
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
