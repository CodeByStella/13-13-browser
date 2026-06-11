import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

import type { FindResult, TabInfo } from '@shared/types';

export function useFindInPage() {
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findResult, setFindResult] = useState<FindResult>({ activeMatch: 0, matches: 0 });
  const findDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const unsub = window.browserApi.onChromeMenuAction((action) => {
      if (action === 'open-find') setFindOpen(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!findOpen) return;
    clearTimeout(findDebounce.current);
    findDebounce.current = setTimeout(() => {
      if (findQuery) {
        void window.browserApi.findInPage(findQuery, true);
      } else {
        void window.browserApi.stopFindInPage();
      }
    }, 150);
    return () => clearTimeout(findDebounce.current);
  }, [findQuery, findOpen]);

  useEffect(() => {
    const unsub = window.browserApi.onFindResult(setFindResult);
    return unsub;
  }, []);

  const closeFind = useCallback(() => {
    setFindOpen(false);
    setFindQuery('');
    setFindResult({ activeMatch: 0, matches: 0 });
    void window.browserApi.stopFindInPage();
  }, []);

  const openFind = useCallback(() => setFindOpen(true), []);

  return {
    findOpen,
    findQuery,
    findResult,
    setFindQuery,
    closeFind,
    openFind,
  };
}

export function useAddressBar(activeTab: TabInfo | null, addressRef: RefObject<HTMLInputElement | null>) {
  const [addressValue, setAddressValue] = useState('');
  const [addressFocused, setAddressFocused] = useState(false);

  useEffect(() => {
    if (activeTab && !addressFocused) {
      setAddressValue(activeTab.url);
    }
  }, [activeTab?.url, addressFocused]);

  const handleNavigate = useCallback(async (rawUrl?: string) => {
    const target = rawUrl ?? addressValue;
    const url = await window.browserApi.navigate(target);
    setAddressValue(url);
    addressRef.current?.blur();
  }, [addressRef, addressValue]);

  return {
    addressValue,
    setAddressValue,
    addressFocused,
    onAddressFocus: () => setAddressFocused(true),
    onAddressBlur: () => setAddressFocused(false),
    handleNavigate,
  };
}
