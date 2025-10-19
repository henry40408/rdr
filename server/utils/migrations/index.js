import migration1 from "./m0001-initial.js";
import migration2 from "./m0002-user-settings.js";

export const migrations = {
  [migration1.name]: migration1,
  [migration2.name]: migration2,
};

export const migrationNames = Object.keys(migrations).slice().sort();
