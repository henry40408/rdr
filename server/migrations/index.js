import migration01 from "../migrations/m0001-initial.js";
import migration02 from "../migrations/m0002-user-settings.js";
import migration03 from "../migrations/m0003-job-paused-at.js";

export const migrations = {
  [migration01.name]: migration01,
  [migration02.name]: migration02,
  [migration03.name]: migration03,
};

export const migrationNames = Object.keys(migrations);
