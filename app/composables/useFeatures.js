export default function () {
  const requestFetch = useRequestFetch();
  const { loggedIn } = useUserSession();
  const { data, refresh } = useAsyncData(() => requestFetch("/api/features"), { watch: [loggedIn] });
  return { data, refresh };
}
