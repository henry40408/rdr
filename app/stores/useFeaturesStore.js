// @ts-check

export const useFeaturesStore = defineStore("features", {
  state: () => ({
    summarization: false,
    save: false,
  }),
  actions: {
    load: async function () {
      const headers = useRequestHeaders(["cookie"]);
      const data = await $fetch("/api/features", { headers });
      this.$patch(data);
    },
  },
});
