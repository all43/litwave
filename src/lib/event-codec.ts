import { LitwaveEvent } from './event.model';

export function encodePayload(event: LitwaveEvent): string {
  const payload: Record<string, string | number> = { msg: event.message };
  if (event.name) { payload.name = event.name; }
  if (event.scheduledTime) { payload.t = event.scheduledTime; }
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const binary = String.fromCharCode(...bytes);
  return btoa(binary)
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodePayload(encoded: string): Omit<LitwaveEvent, 'id'> | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
      + '=='.slice(0, (4 - encoded.length % 4) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (!payload.msg) { return null; }
    const event: Omit<LitwaveEvent, 'id'> = { message: String(payload.msg).toUpperCase() };
    if (payload.name) { event.name = String(payload.name); }
    if (payload.t) {
      const ts = Number(payload.t);
      if (!isNaN(ts)) { event.scheduledTime = ts; }
    }
    return event;
  } catch {
    return null;
  }
}

export function generateUrl(event: LitwaveEvent): string {
  return `https://litwave.app/event?d=${encodePayload(event)}`;
}

export function generateDeepLink(event: LitwaveEvent): string {
  return `litwave://event?d=${encodePayload(event)}`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

export function parseUrl(url: string): LitwaveEvent | null {
  try {
    let searchParams: URLSearchParams;
    if (url.startsWith('litwave://')) {
      const queryString = url.split('?')[1];
      if (!queryString) { return null; }
      searchParams = new URLSearchParams(queryString);
    } else {
      const parsed = new URL(url);
      searchParams = parsed.searchParams;
    }

    const d = searchParams.get('d');
    if (d) {
      const decoded = decodePayload(d);
      if (!decoded) { return null; }
      return { id: generateId(), ...decoded };
    }

    const msg = searchParams.get('msg');
    if (!msg) { return null; }
    const event: LitwaveEvent = { id: generateId(), message: msg.toUpperCase() };
    const t = searchParams.get('t');
    if (t) {
      const ts = parseInt(t, 10);
      if (!isNaN(ts)) { event.scheduledTime = ts; }
    }
    const name = searchParams.get('name');
    if (name) { event.name = name; }
    return event;
  } catch {
    return null;
  }
}
