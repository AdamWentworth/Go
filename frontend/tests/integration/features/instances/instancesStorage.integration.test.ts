// tests/integration/instancesStage.integration.test.ts
import { useLiveInstances }                from "../../utils/liveInstancesCache";
import * as idb                            from "@/db/indexedDB";
import * as PokemonIDUtils                from "@/utils/PokemonIDUtils";
import { vi }                              from "vitest";
import { testLogger, enableLogging }      from "../../setupTests";

describe("instancesStorage Integration", () => {
  beforeAll(() => {
    enableLogging("verbose");
    testLogger.fileStart("Instances");
    testLogger.suiteStart("instancesStorage instances initialization tests");
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    Storage.prototype.getItem = vi.fn().mockReturnValue(null);
    Storage.prototype.setItem = vi.fn();
    // @ts-ignore
    global.performance = { now: vi.fn().mockReturnValue(1000) };
    // Spy on IndexedDB methods
    vi.spyOn(idb, "clearStore").mockResolvedValue(undefined);
    vi.spyOn(idb, "putBulkIntoDB").mockResolvedValue(undefined);
    // Make validateUUID treat any suffix as valid for test consistency
    vi.spyOn(PokemonIDUtils, "validateUUID").mockReturnValue(true);
  });

  it("creates one instance per variant when DB is empty", async () => {
    testLogger.testStep("Mocking getAllFromDB to return an empty array");
    vi.spyOn(idb, "getAllFromDB").mockResolvedValue([]);

    testLogger.testStep("Bootstrapping live instances");
    const instances = await useLiveInstances();
    const count     = Object.keys(instances).length;
    testLogger.metric("Instances created", count);

    testLogger.testStep("Asserting IndexedDB store was cleared");
    expect(idb.clearStore).toHaveBeenCalledWith("pokemonOwnership");
    testLogger.assertion("clearStore called with 'pokemonOwnership'");

    testLogger.testStep("Asserting new items were bulk inserted");
    expect(idb.putBulkIntoDB).toHaveBeenCalledWith(
      "pokemonOwnership",
      expect.any(Array)
    );
    testLogger.assertion("putBulkIntoDB called with 'pokemonOwnership' and items array");

    testLogger.testStep("Asserting ownershipTimestamp was set in localStorage");
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "ownershipTimestamp",
      expect.any(String)
    );
    testLogger.assertion("localStorage.setItem called for 'ownershipTimestamp'");
  });

  it("does not modify storage when DB already has all instances", async () => {
    testLogger.testStep("Mocking getAllFromDB to return existing instances with valid UUID suffixes");
    const variants = Object.keys((await useLiveInstances())).map((instanceId) => {
      // turn our live instances back into a list of "existing" DB records:
      return { instance_id: instanceId };
    });
    vi.spyOn(idb, "getAllFromDB").mockResolvedValue(variants);

    // Clear the cache so useLiveInstances will re-run initializeOrUpdate…
    // (In practice you might restart the Vitest worker, but for here:)
    // @ts-ignore
    globalThis.__INSTANCE_FIXTURE__ = undefined;

    testLogger.testStep("Bootstrapping live instances again");
    const instances = await useLiveInstances();
    testLogger.metric("Variants reused", Object.keys(instances).length);

    testLogger.testStep("Asserting no store clear occurred");
    expect(idb.clearStore).not.toHaveBeenCalled();
    testLogger.assertion("clearStore was not called");

    testLogger.testStep("Asserting no bulk insert occurred");
    expect(idb.putBulkIntoDB).not.toHaveBeenCalled();
    testLogger.assertion("putBulkIntoDB was not called");

    testLogger.testStep("Asserting the returned result has correct length");
    expect(Object.keys(instances)).toHaveLength(Object.keys(instances).length);
    testLogger.assertion(`Result has ${Object.keys(instances).length} entries`);
  });

  it("errors out when DB fetch fails", async () => {
    testLogger.testStep("Mocking getAllFromDB to reject with an error");
    vi.spyOn(idb, "getAllFromDB").mockRejectedValue(new Error("indexeddb fail"));

    // Clear cache so we actually hit our error path
    // @ts-ignore
    globalThis.__INSTANCE_FIXTURE__ = undefined;

    testLogger.testStep("Bootstrapping live instances expecting a failure");
    await expect(useLiveInstances()).rejects.toThrow("Failed to update instances data");
    testLogger.assertion("Error thrown for failed DB fetch");
  });

  // Suite-level end
  testLogger.suiteComplete();
});

// File-level end
testLogger.fileEnd();
