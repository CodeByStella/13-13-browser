import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

import type { FindResult, TabInfo } from '@shared/types';
import { formatAddressBarUrl, formatAddressBarUrlForEditing } from '@shared/utils/url';

export function useFindInPage() {
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findResult, setFindResult] = useState<FindResult>({ activeMatch: 0, matches: 0 });
  const findDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const findInputRef = useRef<HTMLInputElement>(null);

  const focusFindInput = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        findInputRef.current?.focus();
        findInputRef.current?.select();
      });
    });
  }, []);

  useEffect(() => {
    const unsub = window.browserApi.onChromeMenuAction((action) => {
      if (action === 'open-find') {
        setFindOpen(true);
        focusFindInput();
      }
    });
    return unsub;
  }, [focusFindInput]);

  useEffect(() => {
    if (findOpen) focusFindInput();
  }, [findOpen, focusFindInput]);

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

  const openFind = useCallback(() => {
    setFindOpen(true);
    focusFindInput();
  }, [focusFindInput]);

  return {
    findOpen,
    findQuery,
    findResult,
    findInputRef,
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
      setAddressValue(formatAddressBarUrl(activeTab.url));
    }
  }, [activeTab?.url, activeTab?.isLoading, addressFocused]);

  const handleNavigate = useCallback(async (rawUrl?: string) => {
    const target = rawUrl ?? addressValue;
    const url = await window.browserApi.navigate(target);
    setAddressValue(formatAddressBarUrl(url));
    addressRef.current?.blur();
  }, [addressRef, addressValue]);

  const onAddressFocus = useCallback(() => {
    setAddressFocused(true);
    if (activeTab?.url) {
      setAddressValue(formatAddressBarUrlForEditing(activeTab.url));
    }
    requestAnimationFrame(() => {
      addressRef.current?.select();
    });
  }, [activeTab?.url, addressRef]);

  const onAddressBlur = useCallback(() => {
    setAddressFocused(false);
  }, []);

  return {
    addressValue,
    setAddressValue,
    addressFocused,
    onAddressFocus,
    onAddressBlur,
    handleNavigate,
  };
}
