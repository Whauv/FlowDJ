import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The suites here cover pure domain logic and the vanilla Zustand store,
    // so no DOM is needed. When the first component/hook test is added, switch
    // this to "jsdom" and add @testing-library/react + jsdom as dev deps.
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
