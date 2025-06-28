// tests/unit/createPokemonVariants.unit.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { enableLogging, testLogger } from '../../../../setupTests';
import createPokemonVariants from '../../../../../src/features/variants/utils/createPokemonVariants';
import { matchFormsAndVariantType } from '@/utils/formMatcher';
import { useLivePokemons } from '../../../../utils/livePokemonCache';
import type { BasePokemon } from '@/types/pokemonBase';
import type { PokemonVariant } from '@/types/pokemonVariants';

let pokemons: BasePokemon[];
let variants: PokemonVariant[];
let defaults: PokemonVariant[];

describe('🧬 Unit – createPokemonVariants', () => {
  const suiteStart = Date.now();

  beforeAll(async () => {
    enableLogging('verbose');
    testLogger.fileStart('Variant Creation Tests');
    testLogger.suiteStart('Core Transformation Logic');

    testLogger.testStep('Fetching live Pokémon data');
    pokemons = await useLivePokemons();
    testLogger.metric('Base Pokémon Count', pokemons.length);

    testLogger.testStep('Generating variants');
    variants = createPokemonVariants(pokemons);
    defaults = variants.filter(v => v.variantType === 'default');
    testLogger.metric('Total Variants Generated', variants.length);
  });

  afterAll(() => {
    testLogger.complete('Variant Creation Test Suite', Date.now() - suiteStart);
    testLogger.fileEnd();
    testLogger.fileSeparator();
  });

  /* ------------------------------------------------------------------ *
   * BASIC INVARIANTS
   * ------------------------------------------------------------------ */
  it('creates *one* default variant for every base Pokémon', () => {
    testLogger.testStep('Validating default variant count');
    expect(defaults).toHaveLength(pokemons.length);
    testLogger.assertion('Default variants match base Pokémon count');
  });

  it('assigns a unique pokemonKey to every variant', () => {
    testLogger.testStep('Checking key uniqueness');
    const keys = variants.map(v => v.pokemonKey);
    const uniqueKeys = new Set(keys).size;
    
    expect(uniqueKeys).toBe(keys.length);
    testLogger.metric('Unique Keys', uniqueKeys);
  });

  it('pokemonKey format is 4-digit id + hyphen + slug (Unicode allowed)', () => {
    testLogger.testStep('Validating key format');
    let validCount = 0;
    
    variants.forEach(v => {
      expect(v.pokemonKey).toMatch(/^\d{4}-[\p{Letter}0-9._-]+$/u);
      validCount++;
    });
    
    testLogger.metric('Valid Keys', validCount);
  });

  /* ------------------------------------------------------------------ *
   * SHINY & SHADOW
   * ------------------------------------------------------------------ */
  it('creates shiny variants only when shiny_available === 1', () => {
    testLogger.testStep('Validating shiny eligibility');
    const shinyVariants = variants.filter(v => 
      v.variantType.includes('shiny') && !v.variantType.includes('shadow')
    );
    
    shinyVariants.forEach(({ pokemon_id }) => {
      expect(pokemons.find(p => p.pokemon_id === pokemon_id)?.shiny_available).toBe(1);
    });
    
    testLogger.metric('Shiny Variants', shinyVariants.length);
  });

  it('never creates shadow variants without date_shadow_available', () => {
    testLogger.testStep('Validating shadow constraints');
    const shadowVariants = variants.filter(v => v.variantType === 'shadow');
    
    shadowVariants.forEach(({ pokemon_id }) => {
      expect(pokemons.find(p => p.pokemon_id === pokemon_id)?.date_shadow_available)
        .toBeTruthy();
    });
    
    testLogger.metric('Shadow Variants', shadowVariants.length);
  });

  /* ------------------------------------------------------------------ *
   * COSTUME VARIANTS
   * ------------------------------------------------------------------ */
  it('creates costume variants with proper shiny/shadow flags', () => {
    testLogger.testStep('Validating costume generation');
    const costumeMons = pokemons.filter(p => p.costumes?.length);
    
    costumeMons.forEach(p => {
      const generated = variants.filter(v => 
        v.pokemon_id === p.pokemon_id && 
        (v.variantType.startsWith('costume') || v.variantType.startsWith('shadow_costume'))
      );
      
      const expected = p.costumes!.length + 
        p.costumes!.filter(c => c.shiny_available).length +
        p.costumes!.filter(c => c.shadow_costume).length;
      
      expect(generated.length).toBe(expected);
    });
    
    testLogger.metric('Costumed Pokémon', costumeMons.length);
  });

  /* ------------------------------------------------------------------ *
   * MAX FORMS
   * ------------------------------------------------------------------ */
  it('adds dynamax/gigantamax variants according to max[] flags', () => {
    testLogger.testStep('Validating max forms');
    const maxEligible = pokemons.filter(p => p.max?.[0]);
    
    maxEligible.forEach(p => {
      const hasDyna = variants.some(v => 
        v.pokemon_id === p.pokemon_id && v.variantType.includes('dynamax')
      );
      
      const hasGiga = variants.some(v => 
        v.pokemon_id === p.pokemon_id && v.variantType.includes('gigantamax')
      );
      
      expect(hasDyna).toBe(!!p.max?.[0].dynamax);
      expect(hasGiga).toBe(!!p.max?.[0].gigantamax);
    });
    
    testLogger.metric('Max Form Pokémon', maxEligible.length);
  });

  /* ------------------------------------------------------------------ *
   * MEGA/PRIMAL
   * ------------------------------------------------------------------ */
  it('creates mega/primal variants for megaEvolutions entries', () => {
    testLogger.testStep('Validating mega evolutions');
    const megaEligible = pokemons.filter(p => p.megaEvolutions?.length);
    
    megaEligible.forEach(p => {
      const megaCount = variants.filter(v => 
        v.pokemon_id === p.pokemon_id && 
        /^(mega|primal)/.test(v.variantType)
      ).length;
      
      expect(megaCount).toBeGreaterThanOrEqual(p.megaEvolutions!.length);
    });
    
    testLogger.metric('Mega-Evolving Pokémon', megaEligible.length);
  });

  /* ------------------------------------------------------------------ *
   * FUSION
   * ------------------------------------------------------------------ */
  it('creates fusion variants only for base_pokemon_id1 entries', () => {
    testLogger.testStep('Validating fusions');
    const fusionVariants = variants.filter((v: PokemonVariant) => v.variantType.startsWith('fusion_'));
    
    fusionVariants.forEach(({ pokemon_id }) => {
      const baseFusions = pokemons
        .find((p: BasePokemon) => p.pokemon_id === pokemon_id)
        ?.fusion?.filter((f: any) => f.base_pokemon_id1 === pokemon_id);
      
      expect(baseFusions?.length).toBeGreaterThan(0);
    });
    
    testLogger.metric('Fusion Variants', fusionVariants.length);
  });

  /* ------------------------------------------------------------------ *
   * RAID-BOSS FILTER
   * ------------------------------------------------------------------ */
  it('removes non-matching raid_boss entries', () => {
    testLogger.testStep('Validating raid boss filtering');
    let removedCount = 0;
    
    defaults.forEach(d => {
      const base = pokemons.find(p => p.pokemon_id === d.pokemon_id)!;
      const shouldHaveRaidBoss = (base.raid_boss || []).some(rb =>
        matchFormsAndVariantType(d.form, rb.form, d.variantType)
      );
      
      if (!shouldHaveRaidBoss) {
        expect(d.raid_boss).toBeUndefined();
        removedCount++;
      }
    });
    
    testLogger.metric('Filtered Raid Bosses', removedCount);
  });
});