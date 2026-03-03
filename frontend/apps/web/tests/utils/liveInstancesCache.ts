import type { Instances } from '@/types/instances';
import instancesFixture from '../__helpers__/fixtures/instances.json';

let cache: Instances | null = null;

export async function useLiveInstances(): Promise<Instances> {
  if (!cache) {
    cache = instancesFixture as unknown as Instances;
  }
  return structuredClone(cache);
}

