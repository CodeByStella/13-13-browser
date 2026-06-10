/// <reference types="vite/client" />

import type { BrowserApi } from '../electron/preload';

declare global {
  interface Window {
    browserApi: BrowserApi;
  }
}

declare module '*.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

export {};
