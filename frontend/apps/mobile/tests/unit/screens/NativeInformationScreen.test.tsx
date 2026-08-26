import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NATIVE_INFORMATION_PAGES } from '../../../src/features/information/nativeInformationContent';
import { NativeInformationScreen } from '../../../src/screens/NativeInformationScreen';

const renderPage = (slug: keyof typeof NATIVE_INFORMATION_PAGES, onNavigate = jest.fn()) => render(
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, right: 0, bottom: 20, left: 0 } }}>
    <NativeInformationScreen
      assetBaseUrl="https://pokegonexus.com"
      onBack={jest.fn()}
      onNavigate={onNavigate}
      page={NATIVE_INFORMATION_PAGES[slug]}
    />
  </SafeAreaProvider>,
);

describe('NativeInformationScreen', () => {
  it('renders legal content and its effective date without a web fallback', () => {
    renderPage('privacy');
    expect(screen.getByText('Privacy Policy')).toBeTruthy();
    expect(screen.getByText('Last updated July 28, 2026')).toBeTruthy();
    expect(screen.getByText('What Pokémon Go Nexus collects')).toBeTruthy();
  });

  it('filters and expands categorized FAQ answers', () => {
    renderPage('faq');
    fireEvent.press(screen.getByRole('button', { name: 'Filter FAQ by TRADING' }));
    expect(screen.getByText('How do I propose a trade?')).toBeTruthy();
    expect(screen.queryByText('What are custom tags?')).toBeNull();
    fireEvent.press(screen.getByText('How do I propose a trade?'));
    expect(screen.getByText(/Open another trainer’s For Trade/)).toBeTruthy();
  });

  it('routes guide actions through the native navigation adapter', () => {
    const onNavigate = jest.fn();
    renderPage('getting-started', onNavigate);
    fireEvent.press(screen.getByText('Open Pokémon'));
    expect(onNavigate).toHaveBeenCalledWith('/pokemon');
  });

  it('does not carry an FAQ category filter into another information route', () => {
    const view = renderPage('faq');
    fireEvent.press(screen.getByRole('button', { name: 'Filter FAQ by TRADING' }));
    expect(screen.queryByText('What are custom tags?')).toBeNull();

    view.rerender(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, right: 0, bottom: 20, left: 0 } }}>
        <NativeInformationScreen
          assetBaseUrl="https://pokegonexus.com"
          onBack={jest.fn()}
          onNavigate={jest.fn()}
          page={NATIVE_INFORMATION_PAGES.help}
        />
      </SafeAreaProvider>,
    );

    expect(screen.getByText('Account Security')).toBeTruthy();
  });
});
