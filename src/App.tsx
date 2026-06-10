import { useCallback, useEffect, useState } from 'react';
import { BrowserChrome } from './components/BrowserChrome';

export interface NavigationState {
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
}

export interface ContentProtectionState {
  enabled: boolean;
  supported: boolean;
}

const initialNavigation: NavigationState = {
  url: '',
  title: '13.13 Browser',
  canGoBack: false,
  canGoForward: false,
  isLoading: false,
};

export default function App() {
  const [navigation, setNavigation] = useState<NavigationState>(initialNavigation);
  const [addressValue, setAddressValue] = useState('');
  const [protection, setProtection] = useState<ContentProtectionState>({
    enabled: true,
    supported: true,
  });

  useEffect(() => {
    const api = window.browserApi;

    void api.getNavigationState().then((state) => {
      if (state) {
        setNavigation(state);
        setAddressValue(state.url);
      }
    });

    void api.getContentProtection().then(setProtection);

    const unsubNav = api.onNavigationState((state) => {
      setNavigation(state);
      setAddressValue(state.url);
    });

    const unsubProtection = api.onContentProtectionState(setProtection);

    return () => {
      unsubNav();
      unsubProtection();
    };
  }, []);

  const handleNavigate = useCallback(async (rawUrl?: string) => {
    const target = rawUrl ?? addressValue;
    const url = await window.browserApi.navigate(target);
    setAddressValue(url);
  }, [addressValue]);

  const handleAddressKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        void handleNavigate();
      }
    },
    [handleNavigate],
  );

  const toggleProtection = useCallback(async () => {
    const next = await window.browserApi.setContentProtection(!protection.enabled);
    setProtection(next);
  }, [protection.enabled]);

  return (
    <BrowserChrome
      navigation={navigation}
      addressValue={addressValue}
      protection={protection}
      onAddressChange={setAddressValue}
      onAddressKeyDown={handleAddressKeyDown}
      onNavigate={() => void handleNavigate()}
      onGoBack={() => void window.browserApi.goBack()}
      onGoForward={() => void window.browserApi.goForward()}
      onReload={() => void window.browserApi.reload()}
      onStop={() => void window.browserApi.stop()}
      onToggleProtection={() => void toggleProtection()}
    />
  );
}
