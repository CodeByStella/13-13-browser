import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

export interface SessionData {
  tabs: string[];
  activeIndex: number;
}

const FILE = 'session.json';

function filePath(): string {
  return path.join(app.getPath('userData'), FILE);
}

export function loadSession(): SessionData | null {
  try {
    const raw = fs.readFileSync(filePath(), 'utf-8');
    const data = JSON.parse(raw) as SessionData;
    if (!Array.isArray(data.tabs) || data.tabs.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveSession(data: SessionData): void {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(filePath(), JSON.stringify(data, null, 2), 'utf-8');
}
