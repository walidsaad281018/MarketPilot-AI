import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const createApplicationCompositionMock =
  vi.fn(() => ({
    close: vi.fn(),
  }));

vi.mock(
  "@/lib/application/applicationComposition",
  () => ({
    createApplicationComposition:
      createApplicationCompositionMock,
  }),
);

describe(
  "productionApplication",
  () => {
    afterEach(() => {
      vi.resetModules();
      vi.unstubAllEnvs();

      createApplicationCompositionMock
        .mockClear();
    });

    it(
      "uses PostgreSQL and disables seeding in production",
      async () => {
        vi.stubEnv(
          "NODE_ENV",
          "production",
        );

        await import(
          "@/lib/application/productionApplication"
        );

        expect(
          createApplicationCompositionMock,
        ).toHaveBeenCalledTimes(1);

        expect(
          createApplicationCompositionMock,
        ).toHaveBeenCalledWith({
          persistence: "postgres",
          seedDatabase: false,
        });
      },
    );

    it(
      "uses the default SQLite composition outside production",
      async () => {
        vi.stubEnv(
          "NODE_ENV",
          "development",
        );

        await import(
          "@/lib/application/productionApplication"
        );

        expect(
          createApplicationCompositionMock,
        ).toHaveBeenCalledTimes(1);

        expect(
          createApplicationCompositionMock,
        ).toHaveBeenCalledWith();
      },
    );
  },
);
