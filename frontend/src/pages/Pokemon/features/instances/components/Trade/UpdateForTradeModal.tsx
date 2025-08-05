/* ------------------------------------------------------------------ */
/*  UpdateForTradeModal.tsx                                           */
/* ------------------------------------------------------------------ */

import React, { useEffect, useRef, useState } from 'react';
import './UpdateForTradeModal.css';

import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { getVariantByKey } from '@/db/indexedDB';

import OwnedInstance from '../../OwnedInstance';               // keep jsx/tsx default
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';

/* -------------------- props -------------------------------------- */
interface UpdateForTradeModalProps {
  /** Array of *raw* instance rows coming from Indexed-DB / API        */
  ownedInstances: PokemonInstance[];
  /** Base-variant key for DB lookup (e.g. "6_0") – may be null        */
  baseKey?: string | null;
  /** Close the modal                                                  */
  onClose: () => void;
  /** Optional confirm callback – not used inside, but preserved        */
  onConfirm?: () => void;
}

/* -------------------- helper types ------------------------------- */
type VariantWithInstance = PokemonVariant & { instanceData: PokemonInstance };

/* -------------------- component ---------------------------------- */
const UpdateForTradeModal: React.FC<UpdateForTradeModalProps> = ({
  ownedInstances,
  baseKey = null,
  onClose,
}) => {
  /* store actions ------------------------------------------------- */
  const updateDetails = useInstancesStore((s) => s.updateInstanceDetails);

  /* state --------------------------------------------------------- */
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [variantData, setVariantData] = useState<PokemonVariant | null>(null);
  const [restructuredData, setRestructuredData] = useState<VariantWithInstance[]>(
    [],
  );

  /* refs ---------------------------------------------------------- */
  const modalContentRef = useRef<HTMLDivElement | null>(null);

  /* -------------------- fetch variant by key -------------------- */
  useEffect(() => {
    const fetchVariant = async () => {
      if (!baseKey) return;

      setLoading(true);
      setError(null);

      try {
        const data = (await getVariantByKey(baseKey)) as PokemonVariant;
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

  /* -------------------- merge variant + instances --------------- */
  useEffect(() => {
    if (!variantData || ownedInstances.length === 0) return;

    const merged: VariantWithInstance[] = ownedInstances.map((inst) => ({
      ...variantData,
      instanceData: { ...inst },
    }));

    setRestructuredData(merged);
  }, [variantData, ownedInstances]);

  /* -------------------- mark instance “for trade” --------------- */
  const handleUpdateToTrade = async (instanceId: string | undefined) => {
    if (!instanceId) return;

    try {
      /* find the full instance so we can send a complete object */
      const current = restructuredData.find(
        (p) => p.instanceData.instance_id === instanceId,
      )?.instanceData;

      if (!current) return;

      /* clone + mutate the one flag */
      const updatedInstance: PokemonInstance = {
        ...current,
        is_for_trade: true,
      };

      /* store expects a record keyed by ID */
      await updateDetails({ [instanceId]: updatedInstance });

      /* reflect the change locally */
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

  /* -------------------- close on outside click ------------------ */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        modalContentRef.current &&
        !modalContentRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  /* -------------------- render ---------------------------------- */
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
