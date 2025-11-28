<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Edit Feed</div>
      </q-card-section>

      <q-card-section>
        <q-input v-model="xmlUrl" label="Feed XML URL *" :rules="[(val) => !!val || 'Feed XML URL is required']" />
        <q-input v-model="title" label="Feed Title *" :rules="[(val) => !!val || 'Feed Title is required']" />
        <q-input v-model="htmlUrl" label="Feed HTML URL" />
        <q-toggle v-model="disableHttp2" label="Disable HTTP/2" />
        <q-input v-model="userAgent" label="User agent" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="onDialogCancel" />
        <q-btn label="OK" color="primary" :disabled="!valid" @click="onOKClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from "quasar";

const props = defineProps({
  id: { type: Number, required: true },
  categoryName: { type: String, required: true },
  xmlUrl: { type: String, required: true },
  htmlUrl: { type: String, default: undefined },
  title: { type: String, required: true },
  disableHttp2: { type: Boolean, default: false },
  userAgent: { type: String, default: "" },
});

defineEmits({
  ...useDialogPluginComponent.emitsObject,
});

const title = ref(props.title);
const xmlUrl = ref(props.xmlUrl);
const htmlUrl = ref(props.htmlUrl);
const disableHttp2 = ref(props.disableHttp2);
const userAgent = ref(props.userAgent);
const valid = computed(() => title.value.trim().length > 0 && xmlUrl.value.trim().length > 0);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();

function onOKClick() {
  onDialogOK({
    title: title.value,
    xmlUrl: xmlUrl.value,
    htmlUrl: htmlUrl.value,
    disableHttp2: disableHttp2.value,
    userAgent: userAgent.value,
  });
}
</script>
