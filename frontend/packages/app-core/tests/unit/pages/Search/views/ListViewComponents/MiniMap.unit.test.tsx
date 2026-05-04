import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import MiniMap from '@/pages/Search/views/ListViewComponents/MiniMap';

const olMocks = vi.hoisted(() => {
  const mapSetTarget = vi.fn();
  const mapUpdateSize = vi.fn();
  const ctorMock = <T extends object>(factory: () => T) =>
    vi.fn(function MockConstructor() {
      return factory();
    });

  return {
    mapSetTarget,
    mapUpdateSize,
    MapCtor: ctorMock(() => ({
      setTarget: mapSetTarget,
      updateSize: mapUpdateSize,
    })),
    ViewCtor: ctorMock(() => ({})),
    TileLayerCtor: ctorMock(() => ({})),
    XYZCtor: ctorMock(() => ({})),
    VectorLayerCtor: ctorMock(() => ({})),
    VectorSourceCtor: ctorMock(() => ({})),
    FeatureCtor: ctorMock(() => ({})),
    PointCtor: ctorMock(() => ({})),
    StyleCtor: ctorMock(() => ({})),
    CircleCtor: ctorMock(() => ({})),
    FillCtor: ctorMock(() => ({})),
    ZoomCtor: ctorMock(() => ({})),
    fromLonLat: vi.fn((coords: number[]) => coords),
    useThemeMock: vi.fn(() => ({ isLightMode: true })),
  };
});

vi.mock('ol/Map', () => ({ default: olMocks.MapCtor }));
vi.mock('ol/View', () => ({ default: olMocks.ViewCtor }));
vi.mock('ol/layer/Tile', () => ({ default: olMocks.TileLayerCtor }));
vi.mock('ol/source/XYZ', () => ({ default: olMocks.XYZCtor }));
vi.mock('ol/layer/Vector', () => ({ default: olMocks.VectorLayerCtor }));
vi.mock('ol/source/Vector', () => ({ default: olMocks.VectorSourceCtor }));
vi.mock('ol/Feature', () => ({ default: olMocks.FeatureCtor }));
vi.mock('ol/geom/Point', () => ({ default: olMocks.PointCtor }));
vi.mock('ol/style', () => ({
  Style: olMocks.StyleCtor,
  Circle: olMocks.CircleCtor,
  Fill: olMocks.FillCtor,
}));
vi.mock('ol/control/Zoom', () => ({ default: olMocks.ZoomCtor }));
vi.mock('ol/proj', () => ({ fromLonLat: olMocks.fromLonLat }));
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: olMocks.useThemeMock,
}));

describe('MiniMap', () => {
  const resizeObserve = vi.fn();
  const resizeDisconnect = vi.fn();

  beforeEach(() => {
    Object.values(olMocks).forEach((maybeMock) => {
      const resettableMock = maybeMock as { mockReset?: () => void };
      if (typeof resettableMock.mockReset === 'function') {
        resettableMock.mockReset();
      }
    });

    olMocks.MapCtor.mockImplementation(function MapMock() {
      return {
        setTarget: olMocks.mapSetTarget,
        updateSize: olMocks.mapUpdateSize,
      };
    });
    olMocks.useThemeMock.mockReturnValue({ isLightMode: true });
    olMocks.fromLonLat.mockImplementation((coords: number[]) => coords);

    resizeObserve.mockReset();
    resizeDisconnect.mockReset();

    class ResizeObserverMock {
      observe = resizeObserve;

      disconnect = resizeDisconnect;

      constructor(_callback: ResizeObserverCallback) {}
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  });

  it('renders container and skips map init for invalid coordinates', () => {
    const { container } = render(<MiniMap instanceData="caught" />);

    expect(container.querySelector('.mini-map-container')).toBeInTheDocument();
    expect(olMocks.MapCtor).not.toHaveBeenCalled();
  });

  it('initializes OpenLayers map and cleans up on unmount', () => {
    const { unmount } = render(
      <MiniMap latitude={10} longitude={20} instanceData="trade" />,
    );

    expect(olMocks.fromLonLat).toHaveBeenCalledWith([20, 10]);
    expect(olMocks.FillCtor).toHaveBeenCalledWith({ color: '#4cae4f' });
    expect(olMocks.MapCtor).toHaveBeenCalledTimes(1);
    expect(resizeObserve).toHaveBeenCalledTimes(1);

    unmount();

    expect(resizeDisconnect).toHaveBeenCalledTimes(1);
    expect(olMocks.mapSetTarget).toHaveBeenCalledWith(undefined);
  });
});
