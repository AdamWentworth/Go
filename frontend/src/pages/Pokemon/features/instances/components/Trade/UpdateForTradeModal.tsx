// src/features/instances/components/UpdateForTradeModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import './UpdateForTradeModal.css';

import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { getVariantById } from '@/db/indexedDB';

import OwnedInstance from '../../OwnedInstance';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';

interface UpdateForTradeModalProps {
  ownedInstances: PokemonInstance[];
  baseKey?: string | null;
  onClose: () => void;
  onConfirm?: () => void;
}

type VariantWithInstance = PokemonVariant & { instanceData: PokemonInstance };

const UpdateForTradeModal: React.FC<UpdateForTradeModalProps> = ({
  ownedInstances,
  baseKey = null,
  onClose,
}) => {
  const updateDetails = useInstancesStore((s) => s.updateInstanceDetails);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [variantData, setVariantData] = useState<PokemonVariant | null>(null);
  const [restructuredData, setRestructuredData] = useState<VariantWithInstance[]>([]);

  const modalContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchVariant = async () => {
      if (!baseKey) return;

      setLoading(true);
      setError(null);

      try {
        const data = (await getVariantById(baseKey)) as PokemonVariant;
        setVariantData(data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch variant data.');
      } finally {
        setLoading(false);
      }
    };

    fetchVariant();
  }, [baseKey]);

  useEffect(() => {
    if (!variantData || ownedInstances.length === 0) return;

    const merged: VariantWithInstance[] = ownedInstances.map((inst) => ({
      ...variantData,
      instanceData: { ...inst },
    }));

    setRestructuredData(merged);
  }, [variantData, ownedInstances]);

  const handleUpdateToTrade = async (instanceId: string | undefined) => {
    if (!instanceId) return;

    try {
      const current = restructuredData.find(
        (p) => p.instanceData.instance_id === instanceId,
      )?.instanceData;

      if (!current) return;

      const updatedInstance: PokemonInstance = {
        ...current,
        is_for_trade: true,
      };

      await updateDetails({ [instanceId]: updatedInstance } as any);

      setRestructuredData((prev) =>
        prev.map((p) =>
          p.instanceData.instance_id === instanceId
            ? { ...p, instanceData: updatedInstance }
            : p,
        ),
      );
    } catch (err) {
      console.error(err);
      setError(`Failed to update instance ${instanceId} for trade.`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalContentRef.current && !modalContentRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      className="update-for-trade-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content" ref={modalContentRef}>
        <h2 id="modal-title">Update Instances for Trade</h2>

        {loading && <p>Loading variant data…</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && restructuredData.length > 0 && (
          <div className="instances-list">
            {restructuredData.map((pokemon) => (
              <div
                className="instance-item"
                key={pokemon.instanceData.instance_id}
              >
                <OwnedInstance pokemon={pokemon} isEditable={false} />

                <button
                  onClick={() =>
                    handleUpdateToTrade(pokemon.instanceData.instance_id!)
                  }
                  className="update-button"
                  disabled={pokemon.instanceData.is_for_trade}
                >
                  {pokemon.instanceData.is_for_trade
                    ? 'For Trade'
                    : 'Add to For Trade'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateForTradeModal;
