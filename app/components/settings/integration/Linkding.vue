<template>
  <q-form @submit="save">
    <q-list>
      <q-item-label header>Integration: Linkding</q-item-label>
      <q-banner :class="$q.dark.isActive ? 'bg-grey-9 text-white' : 'bg-grey-3'">
        <q-icon v-if="enabled" class="q-mr-sm" color="positive" name="check_circle" />
        <q-icon v-else name="block" class="q-mr-sm" color="negative" />
        Linkding integration is
        <span v-if="enabled">enabled</span>
        <span v-else>disabled</span>.
      </q-banner>
    </q-list>
    <q-list>
      <q-item>
        <q-item-section>
          <q-input
            v-model="model.linkdingApiUrl"
            filled
            clearable
            type="url"
            label="Linkding API URL"
            placeholder="https://example.com"
          />
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-input v-model="model.linkdingApiToken" filled clearable type="password" label="Linkding API Token" />
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-select
            v-model="model.linkdingDefaultTags"
            filled
            multiple
            clearable
            use-chips
            use-input
            hide-dropdown-icon
            label="Default Tags"
            new-value-mode="add-unique"
            hint="Tags to be added to each saved link"
          />
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-btn label="Save" type="submit" color="primary" :loading="pending" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-form>
</template>

<script setup lang="ts">
const $q = useQuasar();

interface LinkdingModel {
  linkdingApiUrl: string;
  linkdingApiToken: string;
  linkdingDefaultTags: string[];
}

const userSettingsStore = useUserSettingsStore();

const enabled = ref(
  !!userSettingsStore.data?.linkdingApiUrl?.trim() && !!userSettingsStore.data?.linkdingApiToken?.trim(),
);
const model = ref<LinkdingModel>({
  linkdingApiUrl: userSettingsStore.data?.linkdingApiUrl ?? "",
  linkdingApiToken: userSettingsStore.data?.linkdingApiToken ?? "",
  linkdingDefaultTags:
    (userSettingsStore.data?.linkdingDefaultTags && JSON.parse(userSettingsStore.data.linkdingDefaultTags)) ?? [],
});

const pending = ref(false);
async function save() {
  pending.value = true;
  try {
    await $fetch("/api/user-settings", {
      method: "PATCH",
      body: {
        linkdingApiUrl: model.value.linkdingApiUrl,
        linkdingApiToken: model.value.linkdingApiToken,
        linkdingDefaultTags: JSON.stringify(model.value.linkdingDefaultTags),
      },
    });
    $q.notify({
      type: "positive",
      message: "Linkding settings saved successfully",
    });
    enabled.value = !!model.value.linkdingApiUrl.trim() && !!model.value.linkdingApiToken.trim();
    userSettingsStore.load();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to save Linkding settings: ${err}`,
    });
  } finally {
    pending.value = false;
  }
}
</script>
