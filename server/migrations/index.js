import migration01 from "../migrations/m0001-initial.js";
import migration02 from "../migrations/m0002-user-settings.js";

export const migrations = {
  [migration01.name]: migration01,
  [migration02.name]: migration02,
};

export const migrationNames = Object.keys(migrations);
