<template>
  <q-form @submit="onSubmit">
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
            hide-bottom-space
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
            hide-bottom-space
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
            hide-bottom-space
            autocomplete="new-password"
            label="Confirm new password *"
            :error-message="errorMessages.confirmPassword"
          />
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-btn type="submit" color="primary" label="Change Password" :loading="saveStatus === 'pending'" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-form>
</template>

<script setup lang="ts">
import { z } from "zod";

const $q = useQuasar();

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation do not match",
    path: ["confirmPassword"],
  });
type Schema = z.infer<typeof schema>;

const errorMessages = ref({
  confirmPassword: "",
});
const model = ref<Schema>({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const error = computed(() => !!errorMessages.value.confirmPassword);

const saveStatus = ref<"idle" | "pending" | "success" | "error">("idle");
async function onSubmit() {
  errorMessages.value = {
    confirmPassword: "",
  };

  const result = schema.safeParse(model.value);
  if (!result.success) {
    const fieldErrors = z.flattenError(result.error).fieldErrors;
    errorMessages.value = {
      confirmPassword: fieldErrors.confirmPassword?.join(", ") ?? "",
    };
    return;
  }
  const parsed = result.data;

  saveStatus.value = "pending";
  try {
    await $fetch(`/api/settings/change-password`, {
      method: "POST",
      body: {
        currentPassword: parsed.currentPassword,
        newPassword: parsed.newPassword,
        confirmPassword: parsed.confirmPassword,
      },
    });
    saveStatus.value = "success";
    model.value = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };
    errorMessages.value = {
      confirmPassword: "",
    };
    $q.notify({
      type: "positive",
      message: "Password changed successfully",
    });
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `Failed to change password: ${err}`,
    });
    saveStatus.value = "error";
  }
}
</script>
