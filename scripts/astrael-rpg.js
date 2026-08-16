import { SYSTEM_ID } from "./core/constants.js";
import { registerSystemHooks } from "./hooks/register-system-hooks.js";

registerSystemHooks();

export { SYSTEM_ID };
