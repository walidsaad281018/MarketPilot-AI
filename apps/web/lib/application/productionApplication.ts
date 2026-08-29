import {
  createApplicationComposition,
  type ApplicationComposition,
} from "@/lib/application/applicationComposition";

type ProductionApplicationGlobal = typeof globalThis & {
  __marketPilotProductionApplication__?:
    ApplicationComposition;
};

const productionGlobal =
  globalThis as ProductionApplicationGlobal;

function createProductionApplication():
  ApplicationComposition {
  if (
    process.env.NODE_ENV === "production"
  ) {
    return createApplicationComposition({
      persistence: "postgres",
      seedDatabase: false,
    });
  }

  return createApplicationComposition();
}

export const productionApplication =
  productionGlobal
    .__marketPilotProductionApplication__ ??
  createProductionApplication();

if (
  process.env.NODE_ENV !== "production"
) {
  productionGlobal
    .__marketPilotProductionApplication__ =
    productionApplication;
}
