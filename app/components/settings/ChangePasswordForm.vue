<template>
  <q-form @submit="save(model)">
    <q-list>
      <q-item-label header>Change Password</q-item-label>
      <q-item>
        <q-item-section>
          <q-input
            v-model="model.currentPassword"
            filled
            required
            :error="error"
            type="password"
            label="Current Password *"
            autocomplete="current-password"
          />
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-input
            v-model="model.newPassword"
            filled
            required
            :error="error"
            type="password"
            label="New password *"
            autocomplete="new-password"
          />
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-input
            v-model="model.confirmPassword"
            filled
            required
            :error="error"
            type="password"
            autocomplete="new-password"
            label="Confirm new password *"
            :error-message="errorMessages.confirmPassword"
          />
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-btn type="submit" color="primary" :loading="updating" label="Change Password" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-form>
</template>

<script setup lang="ts">
const $q = useQuasar();

interface NewPasswordModel {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const errorMessages = ref({
  confirmPassword: "",
});
const model = ref<NewPasswordModel>({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const error = computed(() => !!errorMessages.value.confirmPassword);

function validate(newModel: NewPasswordModel) {
  if (newModel.newPassword !== newModel.confirmPassword) {
    errorMessages.value.confirmPassword = "New password and confirmation do not match.";
    return false;
  }
  if (newModel.newPassword.length < 8) {
    errorMessages.value.confirmPassword = "New password must be at least 8 characters long.";
    return false;
  }
  errorMessages.value.confirmPassword = "";
  return true;
}

const {
  pending: updating,
  error: updateError,
  execute: updatePassword,
} = useFetch("/api/change-password", {
  key: "change-password",
  method: "POST",
  body: model,
  immediate: false,
  watch: false,
});
async function save(newModel: NewPasswordModel) {
  if (!validate(newModel)) return;
  try {
    await updatePassword();
    if (updateError.value) throw updateError.value;
    $q.notify({
      type: "positive",
      message: "Password changed successfully",
    });
    model.value = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to change password: ${err}`,
    });
  }
}
</script>
