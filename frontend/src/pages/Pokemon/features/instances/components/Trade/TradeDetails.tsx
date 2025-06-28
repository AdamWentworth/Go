// TradeDetails.tsx  — fully functional TypeScript clone of TradeDetails.jsx
import React, { useState, useEffect } from 'react';
import './TradeDetails.css';

import EditSaveComponent from '@/components/EditSaveComponent';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useModal } from '@/contexts/ModalContext';

import WantedListDisplay from './WantedListDisplay';
import MirrorManager from './MirrorManager';
import FilterImages from '../../FilterImages';

import useImageSelection from '../../utils/useImageSelection';
import { updateDisplayedList } from '../../utils/listUtils';

import {
  EXCLUDE_IMAGES_wanted,
  INCLUDE_IMAGES_wanted,
  FILTER_NAMES,
} from '../../utils/constants';
import { TOOLTIP_TEXTS } from '../../utils/tooltipTexts';

import useWantedFiltering from '../../hooks/useWantedFiltering';
import useToggleEditModeTrade from '../../hooks/useToggleEditModeTrade';

import PokemonActionOverlay from './PokemonActionOverlay';
import TradeProposal from './TradeProposal';

import { parsePokemonKey } from '@/utils/PokemonIDUtils';
import {
  getAllFromDB,
  OWNERSHIP_DATA_STORE,
  getAllFromTradesDB,
} from '@/db/indexedDB';

import UpdateForTradeModal from './UpdateForTradeModal';

/* ────────────────────────────────────────────────────────── */
/*  Props – still “any” heavy until real domain types exist   */
/* ────────────────────────────────────────────────────────── */
interface TradeDetailsProps {
  pokemon: any;
  lists: any;
  instances: Record<string, any>;
  sortType: string;
  sortMode: string;
  onClose: () => void;
  openWantedOverlay: (data: any) => void;
  variants: any[];
  isEditable: boolean;
  username: string;
}

/* ────────────────────────────────────────────────────────── */
/*  Component                                                */
/* ────────────────────────────────────────────────────────── */
const TradeDetails: React.FC<TradeDetailsProps> = (props) => {
  const {
    pokemon,
    lists,
    instances,
    sortType,
    sortMode,
    openWantedOverlay,
    variants,
    isEditable,
    username,
  } = props;

  const { alert } = useModal();
  const updateDetails = useInstancesStore((s) => s.updateInstanceDetails);

  /* ───── local mirrors of instance fields ───── */
  const { not_wanted_list, wanted_filters } = pokemon.instanceData;

  const [localNotWantedList, setLocalNotWantedList] = useState<
    Record<string, any>
  >({ ...not_wanted_list });

  const [localWantedFilters, setLocalWantedFilters] = useState<
    Record<string, any>
  >({ ...wanted_filters });

  const [isMirror, setIsMirror] = useState<boolean>(pokemon.instanceData.mirror);
  const [mirrorKey, setMirrorKey] = useState<string | null>(null);
  const [listsState, setListsState] = useState<any>(lists);
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, any>>({});
  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
  );

  /* ───── “update-for-trade” modal ───── */
  const [isUpdateForTradeModalOpen, setIsUpdateForTradeModalOpen] =
    useState(false);
  const [ownedInstancesToTrade, setOwnedInstancesToTrade] = useState<any[]>([]);
  const [currentBaseKey, setCurrentBaseKey] = useState<string | null>(null);

  /* hash fed to TradeProposal */
  const [myInstances, setMyInstances] =
    useState<Record<string, any>>();

  /* ───── image-filter selections ───── */
  const {
    selectedImages: selectedExcludeImages,
    toggleImageSelection: toggleExcludeImageSelection,
    setSelectedImages: setSelectedExcludeImages,
  } = useImageSelection(EXCLUDE_IMAGES_wanted);

  const {
    selectedImages: selectedIncludeOnlyImages,
    toggleImageSelection: toggleIncludeOnlyImageSelection,
    setSelectedImages: setSelectedIncludeOnlyImages,
  } = useImageSelection(INCLUDE_IMAGES_wanted);

  /* ───── overlay + trade-proposal state ───── */
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<any>(null);
  const [isTradeProposalOpen, setIsTradeProposalOpen] = useState(false);
  const [tradeClickedPokemon, setTradeClickedPokemon] = useState<any>(null);

  /* ────────────────────────────────── helpers */
  const initializeSelection = (
    names: readonly string[],
    flags: Record<string, any>,
  ) => names.map((n) => !!flags[n]);

  const extractBaseKey = (key: string) => {
    const parts = key.split('_');
    parts.pop();
    return parts.join('_');
  };

  /* ───────────────────────────── effects */
  /* Sync image chips + mirror flag */
  useEffect(() => {
    if (wanted_filters) {
      setSelectedExcludeImages(
        initializeSelection(
          FILTER_NAMES.slice(0, EXCLUDE_IMAGES_wanted.length),
          wanted_filters,
        ),
      );
      setSelectedIncludeOnlyImages(
        initializeSelection(
          FILTER_NAMES.slice(EXCLUDE_IMAGES_wanted.length),
          wanted_filters,
        ),
      );
    }
    setIsMirror(pokemon.instanceData.mirror);
  }, [pokemon.instanceData.mirror, wanted_filters]);

  /* Hook that performs filtering logic (unchanged) */
  const {
    filteredWantedList,
    filteredOutPokemon,
    updatedLocalWantedFilters,
  } = useWantedFiltering(
    listsState,
    selectedExcludeImages,
    selectedIncludeOnlyImages,
    localWantedFilters,
    setLocalNotWantedList,
    localNotWantedList,
    /* pass live editMode, not static flag */
    isEditable ? false : true /* <-- same truthiness as original */,
  );

  useEffect(() => {
    setLocalWantedFilters(updatedLocalWantedFilters);
  }, [updatedLocalWantedFilters]);

  useEffect(() => {
    setLocalNotWantedList({ ...not_wanted_list });
  }, []);

  /* edit / save toggle hook */
  const { editMode, toggleEditMode } = useToggleEditModeTrade(
    pokemon,
    instances,
    isMirror,
    mirrorKey,
    setMirrorKey,
    setIsMirror,
    lists,
    listsState,
    setListsState,
    localNotWantedList,
    setLocalNotWantedList,
    localWantedFilters,
    updateDetails,
    filteredOutPokemon,
  );

  /* window-width listener */
  useEffect(() => {
    const onResize = () => setIsSmallScreen(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ───────────────────────────── callbacks */
  const toggleReciprocalUpdates = (k: string, v: any) =>
    setPendingUpdates((p) => ({ ...p, [k]: v }));

  const closeOverlay = () => setIsOverlayOpen(false);

  const handleResetFilters = () => {
    setSelectedExcludeImages(EXCLUDE_IMAGES_wanted.map(() => false));
    setSelectedIncludeOnlyImages(INCLUDE_IMAGES_wanted.map(() => false));
    setLocalWantedFilters({});
    setLocalNotWantedList({});
  };

  const handlePokemonClick = (key: string) => {
    const baseKey = extractBaseKey(key);
    const variant = variants.find((v) => v.pokemonKey === baseKey);
    if (!variant) return;

    const owned = instances[key];
    if (!owned) return;

    openWantedOverlay({
      ...variant,
      pokemonKey: key,
      instanceData: { ...variant.instanceData, ...owned },
    });
  };

  const handlePokemonClickModified = (key: string, data: any) => {
    if (isEditable) {
      handlePokemonClick(key);
    } else {
      setSelectedPokemon(data);
      setIsOverlayOpen(true);
    }
  };

  const handleViewWantedList = () => {
    if (!selectedPokemon) return;
    handlePokemonClick(selectedPokemon.key);
    closeOverlay();
  };

  /* identical trade-proposal flow (JSX → TS) */
  const handleProposeTrade = async () => {
    if (!selectedPokemon) return;

    const { baseKey: selectedBaseKey } = parsePokemonKey(selectedPokemon.key);

    let userinstances: any[] = [];
    try {
      userinstances = await getAllFromDB(OWNERSHIP_DATA_STORE);
    } catch (e) {
      console.error(e);
      alert('Could not fetch your ownership data.');
      return;
    }

    setMyInstances(
      userinstances.reduce<Record<string, any>>((acc, i) => {
        acc[i.instance_id] = i;
        return acc;
      }, {}),
    );

    const ownedInstances = userinstances.filter((i) => {
      const { baseKey } = parsePokemonKey(i.instance_id);
      return baseKey === selectedBaseKey && i.is_owned;
    });

    if (ownedInstances.length === 0) {
      alert('You do not own this Pokémon.');
      return;
    }

    const tradeable = ownedInstances.filter((i) => i.is_for_trade);

    if (tradeable.length === 0) {
      setOwnedInstancesToTrade(ownedInstances);
      setCurrentBaseKey(selectedBaseKey);
      setIsUpdateForTradeModalOpen(true);
      return;
    }

    try {
      const pending = (await getAllFromTradesDB('pokemonTrades')).filter(
        (t: any) => t.trade_status === 'pending',
      );

      const available = tradeable.filter(
        (i) =>
          !pending.some(
            (t: any) =>
              t.pokemon_instance_id_user_proposed === i.instance_id ||
              t.pokemon_instance_id_user_accepting === i.instance_id,
          ),
      );

      if (available.length === 0) {
        alert(
          'All instances of this Pokémon are already in pending trades.',
        );
        return;
      }

      const { instanceData, ...baseData } = selectedPokemon;
      const matchedInstances = available.map((i) => ({
        ...baseData,
        instanceData: { ...i },
      }));

      setTradeClickedPokemon({ matchedInstances });
      closeOverlay();
      setIsTradeProposalOpen(true);
    } catch (e) {
      console.error(e);
      alert('Could not verify trade availability.');
    }
  };

  /* ───────────────────────────── derived */
  const wantedCount =
    Object.keys(filteredWantedList).filter((k) => !localNotWantedList[k])
      .length;
  const fewLayout = isSmallScreen || wantedCount <= 15;

  /* ───────────────────────────── JSX */
  return (
    <div>
      <div className="trade-details-container">
        {/* Top row (edit/save + mirror) */}
        <div className={`top-row ${isMirror ? 'few-wanted' : ''}`}>
          {isEditable && (
            <div className="edit-save-container">
              <EditSaveComponent
                editMode={editMode}
                toggleEditMode={toggleEditMode}
                isEditable={isEditable}
              />
              {!isMirror && (
                <div className={`reset-container ${editMode ? 'editable' : ''}`}>
                  <img
                    src="/images/reset.png"
                    alt="Reset Filters"
                    style={{ cursor: editMode ? 'pointer' : 'default', width: 25 }}
                    onClick={editMode ? handleResetFilters : undefined}
                  />
                </div>
              )}
            </div>
          )}

          {!isMirror ? (
            !fewLayout ? (
              <>
                <div className="header-group">
                  <h3>Exclude</h3>
                </div>
                <div className="header-group">
                  <h3>Include</h3>
                </div>
              </>
            ) : (
              <div className="header-group include-few">
                <h3>Exclude</h3>
              </div>
            )
          ) : (
            <div className="spacer" />
          )}

          <div className="mirror">
            <MirrorManager
              pokemon={pokemon}
              instances={instances}
              lists={lists}
              isMirror={isMirror}
              setIsMirror={setIsMirror}
              setMirrorKey={setMirrorKey}
              editMode={isEditable}
              updateDisplayedList={(d) =>
                updateDisplayedList(d, listsState, setListsState)
              }
              updateDetails={updateDetails}
            />
          </div>
        </div>

        {/* Image-filter rows */}
        {!isMirror &&
          (!fewLayout ? (
            <div className="image-row-container">
              <div className="exclude-header-group image-group">
                <FilterImages
                  images={EXCLUDE_IMAGES_wanted}
                  selectedImages={selectedExcludeImages}
                  toggleImageSelection={toggleExcludeImageSelection}
                  editMode={editMode}
                  tooltipTexts={FILTER_NAMES.map(
                    (n) => TOOLTIP_TEXTS[n as keyof typeof TOOLTIP_TEXTS],
                  )}
                />
              </div>
              <div className="include-only-header-group image-group">
                <FilterImages
                  images={INCLUDE_IMAGES_wanted}
                  selectedImages={selectedIncludeOnlyImages}
                  toggleImageSelection={toggleIncludeOnlyImageSelection}
                  editMode={editMode}
                  tooltipTexts={FILTER_NAMES.slice(
                    EXCLUDE_IMAGES_wanted.length,
                  ).map((n) => TOOLTIP_TEXTS[n as keyof typeof TOOLTIP_TEXTS])}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="exclude-header-group image-group exclude-few">
                <FilterImages
                  images={EXCLUDE_IMAGES_wanted}
                  selectedImages={selectedExcludeImages}
                  toggleImageSelection={toggleExcludeImageSelection}
                  editMode={editMode}
                  tooltipTexts={FILTER_NAMES.map(
                    (n) => TOOLTIP_TEXTS[n as keyof typeof TOOLTIP_TEXTS],
                  )}
                />
              </div>
              <div className="include-only-header-group include-few">
                <h3>Include</h3>
                <FilterImages
                  images={INCLUDE_IMAGES_wanted}
                  selectedImages={selectedIncludeOnlyImages}
                  toggleImageSelection={toggleIncludeOnlyImageSelection}
                  editMode={editMode}
                  tooltipTexts={FILTER_NAMES.slice(
                    EXCLUDE_IMAGES_wanted.length,
                  ).map((n) => TOOLTIP_TEXTS[n as keyof typeof TOOLTIP_TEXTS])}
                />
              </div>
            </>
          ))}

        {/* Wanted list */}
        <div className="wanted">
          <h2>Wanted List:</h2>
          <WantedListDisplay
            pokemon={pokemon}
            variants={variants}
            lists={{ wanted: filteredWantedList as any }}
            localNotWantedList={localNotWantedList}
            isMirror={isMirror}
            mirrorKey={mirrorKey ?? undefined}
            setLocalNotWantedList={setLocalNotWantedList}
            editMode={editMode}
            instances={instances as any}
            toggleReciprocalUpdates={toggleReciprocalUpdates}
            sortType={sortType as any}
            sortMode={sortMode as any}
            onPokemonClick={(key) =>
              handlePokemonClickModified(key, filteredWantedList[key])
            }
          />
        </div>
      </div>

      {/* Overlay + modals */}
      <PokemonActionOverlay
        isOpen={isOverlayOpen}
        onClose={closeOverlay}
        onViewWantedList={handleViewWantedList}
        onProposeTrade={handleProposeTrade}
        pokemon={selectedPokemon}
      />

      {isTradeProposalOpen && (
        <TradeProposal
          passedInPokemon={pokemon}
          clickedPokemon={tradeClickedPokemon}
          wantedPokemon={selectedPokemon}
          onClose={() => {
            setIsTradeProposalOpen(false);
            setTradeClickedPokemon(null);
          }}
          myInstances={myInstances as any}
          instances={instances as any}
          username={username}
        />
      )}

      {isUpdateForTradeModalOpen && (
        <UpdateForTradeModal
          ownedInstances={ownedInstancesToTrade}
          baseKey={currentBaseKey ?? undefined}
          onClose={() => setIsUpdateForTradeModalOpen(false)}
        />
      )}
    </div>
  );
};

export default TradeDetails;
