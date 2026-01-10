// @ts-check

export const useSystemSettings = defineStore("systemSettings", {
  state: () => ({
    canLogin: false,
    canSignup: false,
  }),
  actions: {
    load: async function () {
      const data = await $fetch("/api/system-settings");
      this.$patch(data);
    },
  },
});
