// utils/buildInstanceChanges.ts
export type MegaData = { isMega: boolean; mega: boolean; megaForm: string | null };
export type IVs = { Attack: number | '' ; Defense: number | '' ; Stamina: number | '' };
export type MovesState = { fastMove: number | null; chargedMove1: number | null; chargedMove2: number | null };
export type FusionState = {
  storedFusionObject: Record<string, unknown> | null;
  is_fused: boolean;
  fusedWith: string | null;
  fusion_form: string | null;
};

type BuildArgs = {
  instanceId: string;
  nickname: string | null;
  isLucky: boolean;
  isFavorite: boolean;
  gender: string | null;
  weight: number | null;
  height: number | null;
  computedCP: number | null;
  computedLevel: number | null;
  moves: MovesState;
  ivs: IVs;
  locationCaught: string | null;
  dateCaught: string | null;
  selectedBackgroundId: number | null;
  megaData: MegaData;
  fusion: FusionState;
  isShadow: boolean;
  isPurified: boolean;
  maxAttack: string | number | '';
  maxGuard: string | number | '';
  maxSpirit: string | number | '';
};

export function buildInstanceChanges(a: BuildArgs) {
  const iv = (v: number | '') => (v === '' ? null : v);
  const maxValue = (v: string | number | '') => {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  return {
    [a.instanceId]: {
      nickname: a.nickname,
      lucky: a.isLucky,
      cp: a.computedCP,
      favorite: a.isFavorite,
      gender: a.gender,
      weight: a.weight,
      height: a.height,
      fast_move_id: a.moves.fastMove,
      charged_move1_id: a.moves.chargedMove1,
      charged_move2_id: a.moves.chargedMove2,
      attack_iv: iv(a.ivs.Attack),
      defense_iv: iv(a.ivs.Defense),
      stamina_iv: iv(a.ivs.Stamina),
      location_caught: a.locationCaught,
      date_caught: a.dateCaught,
      location_card: a.selectedBackgroundId == null ? null : String(a.selectedBackgroundId),
      mega: a.megaData.mega,
      is_mega: a.megaData.isMega,
      mega_form: a.megaData.isMega ? a.megaData.megaForm : null,
      level: a.computedLevel,
      fusion: a.fusion.storedFusionObject,
      is_fused: a.fusion.is_fused,
      fused_with: a.fusion.fusedWith,
      fusion_form: a.fusion.fusion_form,
      shadow: a.isShadow,
      purified: a.isPurified,
      max_attack: maxValue(a.maxAttack),
      max_guard: maxValue(a.maxGuard),
      max_spirit: maxValue(a.maxSpirit),
    }
  };
}
