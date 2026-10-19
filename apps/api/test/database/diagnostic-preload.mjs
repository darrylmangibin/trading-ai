import { registerHooks } from "node:module";

// Loaded only by diagnostic.db-spec.ts children. Runtime files are never changed.
const fault = process.env.DIAGNOSTIC_TEST_FAULT;
const factoryUrl = new URL("../../dist/database/prisma.factory.js", import.meta.url).href;
const checkUrl = new URL("../../dist/database/check-database.js", import.meta.url).href;

registerHooks({
  load(url, context, nextLoad) {
    if (fault === "import-stall" && url === checkUrl) {
      return {
        format: "module",
        shortCircuit: true,
        source: `
          process.send?.("import-entered");
          await new Promise(() => {});
          export function checkDatabase() { throw new Error("Import must remain stalled"); }
        `,
      };
    }

    if (fault === "cleanup-stall" && url === factoryUrl) {
      return {
        format: "module",
        shortCircuit: true,
        source: `
          export function createPrismaClient() {
            return {
              $queryRaw: async () => [{ value: 1 }],
              $disconnect() {
                process.send?.("cleanup-entered");
                return new Promise(() => {});
              },
            };
          }
        `,
      };
    }

    return nextLoad(url, context);
  },
});
