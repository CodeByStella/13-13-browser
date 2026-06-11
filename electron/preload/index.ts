import { contextBridge } from 'electron';

import { browserApi } from './browser-api';
import { chromeMenuApi, privacyPanelApi, sitePermissionsApi } from './popup-apis';

contextBridge.exposeInMainWorld('browserApi', browserApi);
contextBridge.exposeInMainWorld('chromeMenuApi', chromeMenuApi);
contextBridge.exposeInMainWorld('privacyPanelApi', privacyPanelApi);
contextBridge.exposeInMainWorld('sitePermissionsApi', sitePermissionsApi);

export type { BrowserApi } from './browser-api';
