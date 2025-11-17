// @ts-check

import migration01 from "../migrations/m0001-initial.js";
import migration02 from "../migrations/m0002-user-settings.js";
import migration03 from "../migrations/m0003-job-paused-at.js";
import migration04 from "../migrations/m0004-add-last-error-to-feeds.js";
import migration05 from "../migrations/m0005-add-error-count-to-feeds.js";
import migration06 from "../migrations/m0006-index-feed-id-id-date-on-entries.js";
import migration07 from "../migrations/m0007-add-nonce-to-users.js";

export const migrations = {
  [migration01.name]: migration01,
  [migration02.name]: migration02,
  [migration03.name]: migration03,
  [migration04.name]: migration04,
  [migration05.name]: migration05,
  [migration06.name]: migration06,
  [migration07.name]: migration07,
};

export const migrationNames = Object.keys(migrations);
