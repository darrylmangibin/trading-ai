import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { createPrismaClient } from "./prisma.factory.js";

vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: vi.fn(class {}) }));

vi.mock("../generated/prisma/client.js", () => ({ PrismaClient: vi.fn(class {}) }));

const configuration = {
  connectionString: "postgresql://trading_test:synthetic@127.0.0.1:5556/trading_test",
};

describe("Prisma client factory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preserves driver defaults when no diagnostic budget is supplied", () => {
    createPrismaClient(configuration);

    expect(PrismaPg).toHaveBeenCalledExactlyOnceWith(configuration);
  });

  it.each([1, 3500, 5000])(
    "bounds every driver phase by the supplied %i ms budget",
    (timeoutMillis) => {
      createPrismaClient(configuration, timeoutMillis);

      expect(PrismaPg).toHaveBeenCalledExactlyOnceWith({
        ...configuration,
        connectionTimeoutMillis: timeoutMillis,
        query_timeout: timeoutMillis,
        statement_timeout: timeoutMillis,
      });
    },
  );

  it("returns the client using its own adapter with logging disabled and minimal errors", () => {
    const client = createPrismaClient(configuration, 5000);
    const adapter = vi.mocked(PrismaPg).mock.instances[0];

    expect(PrismaClient).toHaveBeenCalledExactlyOnceWith({
      adapter,
      log: [],
      errorFormat: "minimal",
    });

    expect(client).toBe(vi.mocked(PrismaClient).mock.instances[0]);
  });
});
