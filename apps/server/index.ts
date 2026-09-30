// Canonical server entrypoint lives in /server so the API runtime is shared
// by local development and the production container.
import "../../server/index.js";
