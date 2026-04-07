import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import InstanceDetailsLayout from '@/pages/Pokemon/features/instances/sections/InstanceDetailsLayout';

vi.mock('@/pages/Pokemon/features/instances/sections/HeaderRow', () => ({
  default: () => <div>header-row</div>,
}));

vi.mock('@/pages/Pokemon/features/instances/sections/BackgroundSelector', () => ({
  default: () => <div>background-selector</div>,
}));

vi.mock('@/pages/Pokemon/features/instances/sections/ImageStage', () => ({
  default: () => <div>image-stage</div>,
}));

vi.mock('@/pages/Pokemon/features/instances/sections/IdentityRow', () => ({
  default: () => <div>identity-row</div>,
}));

vi.mock('@/pages/Pokemon/features/instances/sections/LevelGenderRow', () => ({
  default: () => <div>level-gender-row</div>,
}));

vi.mock('@/pages/Pokemon/features/instances/sections/StatsRow', () => ({
  default: ({ addBottomGap }: { addBottomGap?: boolean }) => (
    <div>{`stats-row-${addBottomGap ? 'gap' : 'default'}`}</div>
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/sections/MovesAndIV', () => ({
  default: () => <div>moves-and-iv</div>,
}));

vi.mock('@/pages/Pokemon/features/instances/sections/MetaPanel', () => ({
  default: () => <div>meta-panel</div>,
}));

vi.mock('@/pages/Pokemon/features/instances/components/Caught/LevelArc', () => ({
  default: ({ level }: { level: number }) => <div>{`level-arc-${level}`}</div>,
}));

vi.mock('@/pages/Pokemon/features/instances/sections/CaughtDateRibbon', () => ({
  default: ({ dateCaught }: { dateCaught: string | null }) => (
    <div>{`caught-date-ribbon-${dateCaught ?? 'none'}`}</div>
  ),
}));

describe('InstanceDetailsLayout', () => {
  it('renders the shared section sequence and optional nodes', () => {
    render(
      <InstanceDetailsLayout
        className="test-layout"
        dateCaught="2025-01-02"
        headerRow={{} as any}
        backgroundSelector={{} as any}
        imageStage={{} as any}
        identityRow={{} as any}
        levelGenderRow={{} as any}
        statsRow={{} as any}
        movesAndIV={{} as any}
        metaPanel={{} as any}
        levelArcLevel={35}
        powerContent={<div>power-content</div>}
        postPowerContent={<div>post-power-content</div>}
        showPowerDivider
        footerContent={<div>footer-content</div>}
      />,
    );

    expect(document.querySelector('.test-layout')).not.toBeNull();
    expect(screen.getByText('caught-date-ribbon-2025-01-02')).toBeInTheDocument();
    expect(screen.getByText('header-row')).toBeInTheDocument();
    expect(screen.getByText('background-selector')).toBeInTheDocument();
    expect(screen.getByText('level-arc-35')).toBeInTheDocument();
    expect(screen.getByText('image-stage')).toBeInTheDocument();
    expect(screen.getByText('identity-row')).toBeInTheDocument();
    expect(screen.getByText('level-gender-row')).toBeInTheDocument();
    expect(screen.getByText('stats-row-default')).toBeInTheDocument();
    expect(screen.getByText('power-content')).toBeInTheDocument();
    expect(screen.getByText('post-power-content')).toBeInTheDocument();
    expect(document.querySelector('.caught-power-divider')).not.toBeNull();
    expect(screen.getByText('moves-and-iv')).toBeInTheDocument();
    expect(screen.getByText('meta-panel')).toBeInTheDocument();
    expect(screen.getByText('footer-content')).toBeInTheDocument();
  });

  it('omits optional power/footer regions when not provided', () => {
    render(
      <InstanceDetailsLayout
        dateCaught={null}
        headerRow={{} as any}
        backgroundSelector={{} as any}
        imageStage={{} as any}
        identityRow={{} as any}
        levelGenderRow={{} as any}
        statsRow={{} as any}
        movesAndIV={{} as any}
        metaPanel={{} as any}
        levelArcLevel={null}
        showStatsDivider={false}
        showMetaDivider={false}
        showMetaPanel={false}
        addStatsBottomGap
      />,
    );

    expect(screen.queryByText('caught-date-ribbon-none')).not.toBeInTheDocument();
    expect(screen.queryByText('level-arc-1')).not.toBeInTheDocument();
    expect(screen.getByText('stats-row-gap')).toBeInTheDocument();
    expect(document.querySelector('.caught-stats-divider')).toBeNull();
    expect(document.querySelector('.caught-power-divider')).toBeNull();
    expect(document.querySelector('.meta-divider')).toBeNull();
    expect(screen.queryByText('meta-panel')).not.toBeInTheDocument();
    expect(screen.queryByText('footer-content')).not.toBeInTheDocument();
  });

  it('can suppress the separate background selector row', () => {
    render(
      <InstanceDetailsLayout
        dateCaught={null}
        headerRow={{} as any}
        backgroundSelector={{} as any}
        imageStage={{} as any}
        identityRow={{} as any}
        levelGenderRow={{} as any}
        statsRow={{} as any}
        movesAndIV={{} as any}
        metaPanel={{} as any}
        levelArcLevel={null}
        showBackgroundSelectorRow={false}
      />,
    );

    expect(screen.queryByText('background-selector')).not.toBeInTheDocument();
  });
});
