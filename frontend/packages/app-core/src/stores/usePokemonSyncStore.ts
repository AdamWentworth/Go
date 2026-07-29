import { create } from 'zustand';

export type PokemonSyncState = {
  pendingCount: number;
  status: 'idle' | 'sending' | 'reconciling' | 'error';
  lastSuccessfulSync: number | null;
  error: string | null;
  updateQueueStatus(
    pendingCount: number,
    status: 'idle' | 'sending' | 'reconciling' | 'error',
    error?: string,
  ): void;
  markReconciling(): void;
  markReconciled(): void;
  markReconcileFailed(error: unknown): void;
};

export const usePokemonSyncStore = create<PokemonSyncState>((set) => ({
  pendingCount: 0,
  status: 'idle',
  lastSuccessfulSync: null,
  error: null,
  updateQueueStatus: (pendingCount, status, error) =>
    set({
      pendingCount,
      status,
      error: error ?? null,
      ...(status === 'idle' ? { lastSuccessfulSync: Date.now() } : {}),
    }),
  markReconciling: () => set({ status: 'reconciling', error: null }),
  markReconciled: () =>
    set({ status: 'idle', lastSuccessfulSync: Date.now(), error: null }),
  markReconcileFailed: (error) =>
    set({
      status: 'error',
      error: error instanceof Error ? error.message : 'Reconciliation failed',
    }),
}));
