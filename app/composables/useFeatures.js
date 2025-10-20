export default function () {
  const requestFetch = useRequestFetch();
  const { loggedIn } = useUserSession();
  const { data: features } = useAsyncData(() => requestFetch("/api/features"), { watch: [loggedIn] });
  return features;
}
