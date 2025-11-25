// @ts-check

import migration0001 from "../migrations/m0001-initial.js";
import migration0002 from "../migrations/m0002-user-settings.js";
import migration0003 from "../migrations/m0003-job-paused-at.js";
import migration0004 from "../migrations/m0004-add-last-error-to-feeds.js";
import migration0005 from "../migrations/m0005-add-error-count-to-feeds.js";
import migration0006 from "../migrations/m0006-index-feed-id-id-date-on-entries.js";
import migration0007 from "../migrations/m0007-add-nonce-to-users.js";
import migration0008 from "../migrations/m0008-add-passkeys.js";
import migration0009 from "../migrations/m0009-add-display-name-to-passkeys.js";
import migration0010 from "../migrations/m0010-add-disable-http2-to-feeds.js";
import migration0011 from "../migrations/m0011-add-user-agent-to-feeds.js";

export const migrations = {
  [migration0001.name]: migration0001,
  [migration0002.name]: migration0002,
  [migration0003.name]: migration0003,
  [migration0004.name]: migration0004,
  [migration0005.name]: migration0005,
  [migration0006.name]: migration0006,
  [migration0007.name]: migration0007,
  [migration0008.name]: migration0008,
  [migration0009.name]: migration0009,
  [migration0010.name]: migration0010,
  [migration0011.name]: migration0011,
};

export const migrationNames = Object.keys(migrations);
