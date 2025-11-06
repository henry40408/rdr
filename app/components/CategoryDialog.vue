<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Edit Category</div>
      </q-card-section>

      <q-card-section>
        <q-input v-model="name" label="Category name *" :rules="[(val) => !!val || 'Category name is required']" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="onDialogCancel" />
        <q-btn label="OK" color="primary" :disabled="!valid" @click="onOKClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useDialogPluginComponent } from "quasar";

const props = defineProps({
  id: { type: Number, required: true },
  name: { type: String, required: true },
});

defineEmits({
  ...useDialogPluginComponent.emitsObject,
});

const name = ref(props.name);
const valid = computed(() => name.value.trim().length > 0);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();

function onOKClick() {
  onDialogOK({ name: name.value });
}
</script>
