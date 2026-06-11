import type { ContentProtectionState } from '@shared/types';

import { supportsExcludeFromCapture } from '../../lib/shared';

let enabled = true;

export function setContentProtectionPreference(value: boolean): void {
  enabled = value;
}

export function isContentProtectionEnabled(): boolean {
  return enabled;
}

export function getContentProtectionState(): ContentProtectionState {
  return {
    enabled,
    supported: supportsExcludeFromCapture(),
  };
}
