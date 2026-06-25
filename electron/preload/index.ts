import { contextBridge } from 'electron';

import { browserApi } from './browser-api';
import {
  aboutApi,
  bookmarkMenuApi,
  chromeMenuApi,
  privacyPanelApi,
  sitePermissionsApi,
  tabPickerApi,
  traySettingsApi,
} from './popup-apis';

contextBridge.exposeInMainWorld('browserApi', browserApi);
contextBridge.exposeInMainWorld('bookmarkMenuApi', bookmarkMenuApi);
contextBridge.exposeInMainWorld('chromeMenuApi', chromeMenuApi);
contextBridge.exposeInMainWorld('privacyPanelApi', privacyPanelApi);
contextBridge.exposeInMainWorld('sitePermissionsApi', sitePermissionsApi);
contextBridge.exposeInMainWorld('aboutApi', aboutApi);
contextBridge.exposeInMainWorld('traySettingsApi', traySettingsApi);
contextBridge.exposeInMainWorld('tabPickerApi', tabPickerApi);

export type { BrowserApi } from './browser-api';
