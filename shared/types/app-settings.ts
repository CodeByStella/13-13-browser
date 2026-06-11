export interface AppSettings {
  /** Minimize button hides the window to the system tray. */
  minimizeToTray: boolean;
  /** Close button hides to tray instead of quitting (Quit remains in tray menu). */
  closeToTray: boolean;
  /** Global accelerator to show/hide the browser window. */
  showHideHotkey: string;
  /** Whether the show/hide hotkey is active. */
  hotkeyEnabled: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  minimizeToTray: false,
  closeToTray: true,
  showHideHotkey: 'CommandOrControl+Shift+H',
  hotkeyEnabled: true,
};

export interface TraySettingsPanelData {
  settings: AppSettings;
  hotkeyRegistered: boolean;
}
