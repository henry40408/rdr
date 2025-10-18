const USER_ID_COOKIE_NAME = "userId";

/**
 * @param {import('h3').H3Event} event
 * @returns {number | undefined}
 * */
export function getUserId(event) {
  const userId = getCookie(event, USER_ID_COOKIE_NAME);
  return userId ? Number(userId) : undefined;
}

/**
 * @param {import('h3').H3Event} event
 * @returns {number}
 * @throws {Error} If user ID is not found in cookies
 */
export function getUserIdOrThrow(event) {
  const userId = getUserId(event);
  if (!userId) throw createError({ statusCode: 401, message: "Unauthorized" });
  return userId;
}
