// tests/unit/instancesStorage.unit.test.ts

import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from "vitest";
import * as idb from "@/db/indexedDB";
import {
  getInstancesData,
  setInstancesData,
  initializeOrUpdateInstancesData,
} from "@/features/instances/storage/instancesStorage";
import * as IDUtils from "@/utils/PokemonIDUtils";
import * as CreateModule from "@/features/instances/utils/createNewInstanceData";
import { testLogger, enableLogging } from "../../setupTests";
import type { Instances } from "@/types/instances";
import type { PokemonInstance } from "@/types/pokemonInstance";
import type { PokemonVariant } from "@/types/pokemonVariants";

describe("instancesStorage (unit)", () => {
  beforeAll(() => {
    enableLogging("verbose");
    testLogger.fileStart("Instances");
    testLogger.suiteStart("instancesStorage unit tests");
  });

  afterAll(() => {
    testLogger.suiteComplete();
    testLogger.fileEnd();
  });

  beforeEach(() => {
    testLogger.suiteStart("reset mocks and spies");
    vi.restoreAllMocks();
    Storage.prototype.getItem = vi.fn();
    Storage.prototype.setItem = vi.fn();
    // @ts-ignore
    global.performance = { now: vi.fn().mockReturnValue(500) };
    vi.spyOn(idb, "clearStore").mockResolvedValue(undefined);
    vi.spyOn(idb, "putBulkIntoDB").mockResolvedValue(undefined);
    testLogger.suiteComplete();
  });

  describe("getInstancesData", () => {
    beforeEach(() => testLogger.suiteStart("getInstancesData"));
    afterEach(() => testLogger.suiteComplete());

    it("parses only items with instance_id and reads timestamp", async () => {
      testLogger.testStep("mock getAllFromDB to return mixed items");
      const raw = [
        { instance_id: "a_1", foo: "bar" },
        { foo: "skipme" },
      ] as any as PokemonInstance[];
      vi.spyOn(idb, "getAllFromDB").mockResolvedValue(raw);
      Storage.prototype.getItem = vi.fn().mockReturnValue("12345");

      testLogger.testStep("call getInstancesData");
      const { data, timestamp } = await getInstancesData();

      testLogger.metric("parsed entries", Object.keys(data).length);
      expect(data).toHaveProperty("a_1");
      testLogger.assertion("data includes a_1");
      expect(data).not.toHaveProperty("skipme");
      testLogger.assertion("data excludes skipme");
      expect(timestamp).toBe(12345);
      testLogger.assertion("timestamp parsed as 12345");
    });

    it("defaults timestamp to 0 on invalid value", async () => {
      testLogger.testStep("mock getAllFromDB to return empty and timestamp NaN");
      vi.spyOn(idb, "getAllFromDB").mockResolvedValue([] as any as PokemonInstance[]);
      Storage.prototype.getItem = vi.fn().mockReturnValue("NaN");

      testLogger.testStep("call getInstancesData");
      const { timestamp } = await getInstancesData();

      expect(timestamp).toBe(0);
      testLogger.assertion("timestamp defaults to 0");
    });

    it("propagates errors from IndexedDB", async () => {
      vi.spyOn(idb, "getAllFromDB").mockRejectedValue(new Error("db fail"));
      await expect(getInstancesData()).rejects.toThrow("db fail");
    });

    it("logs warning for missing instance_id in development mode", async () => {
      process.env.NODE_ENV = 'development';
      const raw = [{ foo: 'no_id' }];
      vi.spyOn(idb, "getAllFromDB").mockResolvedValue(raw as any);
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await getInstancesData();
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('[getInstancesData] Skipped item without instance_id:'),
        raw[0]
      );
      process.env.NODE_ENV = 'test';
    });

    it("sanitizes negative or non-numeric timestamp to zero", async () => {
      vi.spyOn(idb, "getAllFromDB").mockResolvedValue([] as any);
      Storage.prototype.getItem = vi.fn().mockReturnValue('-100');
      const { timestamp } = await getInstancesData();
      expect(timestamp).toBe(0);
    });
  });

  describe("setInstancesData", () => {
    beforeEach(() => testLogger.suiteStart("setInstancesData"));
    afterEach(() => testLogger.suiteComplete());

    it("clears store, bulk inserts, and sets localStorage", async () => {
      testLogger.testStep("prepare payload with two instances");
      const payload: { data: Instances; timestamp: number } = {
        data: {
          foo: { x: 1 } as unknown as PokemonInstance,
          bar: { y: 2 } as unknown as PokemonInstance,
        },
        timestamp: 999,
      };

      testLogger.testStep("call setInstancesData");
      await setInstancesData(payload);

      expect(idb.clearStore).toHaveBeenCalledWith("pokemonOwnership");
      testLogger.assertion("clearStore called with pokemonOwnership");
      expect(idb.putBulkIntoDB).toHaveBeenCalledWith("pokemonOwnership", [
        { x: 1, instance_id: "foo" },
        { y: 2, instance_id: "bar" },
      ]);
      testLogger.assertion("putBulkIntoDB called with correct items");
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "ownershipTimestamp",
        "999"
      );
      testLogger.assertion("localStorage.setItem called with timestamp 999");
    });

    it("throws if clearStore fails", async () => {
      testLogger.testStep("mock clearStore to reject");
      vi.spyOn(idb, "clearStore").mockRejectedValue(new Error("clear fail"));

      testLogger.testStep("call setInstancesData and expect rejection");
      await expect(
        setInstancesData({ data: {} as Instances, timestamp: 0 })
      ).rejects.toThrow("clear fail");
      testLogger.assertion("error bubbled from clearStore");
    });

    it("throws if putBulkIntoDB fails", async () => {
      testLogger.testStep("mock putBulkIntoDB to reject");
      vi.spyOn(idb, "putBulkIntoDB").mockRejectedValue(new Error("put fail"));

      testLogger.testStep("call setInstancesData and expect rejection");
      await expect(
        setInstancesData({ data: { a: {} as unknown as PokemonInstance }, timestamp: 1 })
      ).rejects.toThrow("put fail");
      testLogger.assertion("error bubbled from putBulkIntoDB");
    });

    it("logs performance duration in development mode", async () => {
      process.env.NODE_ENV = 'development';
      const payload = { data: { foo: {} as any }, timestamp: 1 };
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      // @ts-ignore
      global.performance = { now: vi.fn().mockReturnValueOnce(0).mockReturnValueOnce(25) };

      await setInstancesData(payload);
      expect(log).toHaveBeenCalledWith(
        expect.stringMatching(/Stored instances into IndexedDB in \d+ ms/)
      );
      process.env.NODE_ENV = 'test';
    });

    it("propagates errors from localStorage.setItem", async () => {
      Storage.prototype.setItem = vi.fn().mockImplementation(() => { throw new Error('ls fail'); });
      await expect(
        setInstancesData({ data: {}, timestamp: 0 })
      ).rejects.toThrow('ls fail');
    });
  });

  describe("initializeOrUpdateInstancesData", () => {
    beforeEach(() => testLogger.suiteStart("initializeOrUpdateInstancesData"));
    afterEach(() => testLogger.suiteComplete());

    const dummyVariants = [{} as PokemonVariant, {} as PokemonVariant];
    const dummyKeys = ["k1", "k2"];

    beforeEach(() => {
      testLogger.testStep("stub createNewInstanceData");
      vi.spyOn(CreateModule, "createNewInstanceData").mockReturnValue({ new: true } as any);
    });

    it("adds only missing variants (partial-populate)", async () => {
      testLogger.testStep("mock existing k1 in DB");
      const storedDb = [{ instance_id: "k1_UUID1" }] as any as PokemonInstance[];
      vi.spyOn(idb, "getAllFromDB").mockResolvedValue(storedDb);
      Storage.prototype.getItem = vi.fn().mockReturnValue(null);
      vi.spyOn(IDUtils, "validateUUID").mockReturnValue(true);
      vi.spyOn(IDUtils, "generateUUID").mockReturnValue("NEWUUID");

      testLogger.testStep("call initializeOrUpdateInstancesData");
      const result = await initializeOrUpdateInstancesData(dummyKeys, dummyVariants);
      const keys = Object.keys(result);

      testLogger.metric("total entries after update", keys.length);
      expect(keys).toContain("k1_UUID1");
      testLogger.assertion("retains k1_UUID1");
      expect(keys).toContain("k2_NEWUUID");
      testLogger.assertion("adds k2_NEWUUID");
      expect(idb.clearStore).toHaveBeenCalled();
      testLogger.assertion("clearStore called");
      expect(idb.putBulkIntoDB).toHaveBeenCalled();
      testLogger.assertion("putBulkIntoDB called");
    });

    it("handles mismatched keys and variants by ignoring extra keys", async () => {
      const keys = ['a','b','c'];
      const variants = [{} as PokemonVariant, {} as PokemonVariant];
      vi.spyOn(idb, 'getAllFromDB').mockResolvedValue([] as PokemonInstance[]);
      Storage.prototype.getItem = vi.fn().mockReturnValue(null);
      vi.spyOn(IDUtils, 'validateUUID').mockReturnValue(false);
      vi.spyOn(IDUtils, 'generateUUID')
        .mockImplementationOnce(() => 'U0')
        .mockImplementationOnce(() => 'U1');

      const res = await initializeOrUpdateInstancesData(keys, variants);
      const outKeys = Object.keys(res);
      expect(outKeys).toHaveLength(2);
      expect(outKeys).toEqual(expect.arrayContaining(['a_U0','b_U1']));
    });

    it("regenerates suffix when multiple underscores present in key", async () => {
      const storedDb = [{ instance_id: 'multi_part_key_42' }] as any as PokemonInstance[];
      vi.spyOn(idb, 'getAllFromDB').mockResolvedValue(storedDb);
      Storage.prototype.getItem = vi.fn().mockReturnValue(null);
      vi.spyOn(IDUtils, 'validateUUID').mockReturnValue(false);
      vi.spyOn(IDUtils, 'generateUUID').mockReturnValue('X123');

      const res = await initializeOrUpdateInstancesData(['multi_part_key'], [{} as PokemonVariant]);
      expect(Object.keys(res)).toContain('multi_part_key_X123');
    });

    it("logs 'no updates required' when all variants exist", async () => {
      process.env.NODE_ENV = 'development';
      const storedDb = [{ instance_id: 'k1_UUID' }, { instance_id: 'k2_UUID' }] as any as PokemonInstance[];
      vi.spyOn(idb, 'getAllFromDB').mockResolvedValue(storedDb);
      Storage.prototype.getItem = vi.fn().mockReturnValue(null);
      vi.spyOn(IDUtils, 'validateUUID').mockReturnValue(true);
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});

      await initializeOrUpdateInstancesData(dummyKeys, dummyVariants);
      expect(log).toHaveBeenCalledWith('[instancesStorage] No updates required.');
      process.env.NODE_ENV = 'test';
    });

    it("throws on DB fetch error", async () => {
      vi.spyOn(idb, "getAllFromDB").mockRejectedValue(new Error("read fail"));
      await expect(
        initializeOrUpdateInstancesData([], [])
      ).rejects.toThrow("Failed to update instances data");
    });
  });

});
