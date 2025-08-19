// app/lib/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://api.ldh.monster';

/**
 * B안(현재): accessToken 하나만 Authorization에 사용.
 * A안(추후): accessToken + refreshToken + userId 저장 후, 401에서 refresh 1회 시도.
 */

// Storage keys
export const ACCESS_KEY = 'accessToken';
export const REFRESH_KEY = 'refreshToken'; // A안에서 사용
export const USER_ID_KEY = 'userId';       // A안에서 사용

// ── Token helpers ─────────────────────────────────────────────────────────────
export async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_KEY);
}
export async function setAccessToken(token: string) {
  await AsyncStorage.setItem(ACCESS_KEY, token);
}

// A안 전환 시 사용 (B안에서는 굳이 안 써도 됨 — 주석 해제 없이 놔둬도 무해)
export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_KEY);
}
export async function setRefreshToken(token: string) {
  await AsyncStorage.setItem(REFRESH_KEY, token);
}
export async function getUserId() {
  return AsyncStorage.getItem(USER_ID_KEY);
}
export async function setUserId(uid: string | number) {
  await AsyncStorage.setItem(USER_ID_KEY, String(uid));
}

export async function clearSession() {
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY, USER_ID_KEY]);
}

// ── Internal utils ───────────────────────────────────────────────────────────
function buildUrl(path: string) {
  return /^https?:\/\//.test(path) ? path : `${BASE_URL}${path}`;
}

function buildHeaders(options: RequestInit, token?: string) {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

async function doFetch(path: string, options: RequestInit, token?: string) {
  const url = buildUrl(path);
  const headers = buildHeaders(options, token);
  return fetch(url, { ...options, headers });
}

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

async function toApiError(res: Response) {
  let detail: any = '';
  try { detail = await res.clone().json(); }
  catch { try { detail = await res.text(); } catch { detail = ''; } }
  const msg = [
    `${res.status} ${res.statusText}`,
    typeof detail === 'string' ? detail : detail?.message,
  ].filter(Boolean).join(' | ');
  return new Error(msg);
}

/* ─────────────────────────────────────────────────────────────────────────────
 * A안 전환 시 사용할 리프레시 로직 (지금은 비활성화 상태 — 주석 유지)
 * 아래 블록과 apiFetch의 401 처리 블록을 주석 해제하면 A안으로 동작.
 ------------------------------------------------------------------------------
async function tryRefreshOnce(): Promise<string | null> {
  const [refreshToken, uid] = await Promise.all([getRefreshToken(), getUserId()]);
  if (!refreshToken || !uid) return null;

  const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ uid: Number(uid), refreshToken }),
  });
  if (!res.ok) return null;

  const json: any = await safeJson(res);
  const newAccess = json?.accessToken as string | undefined;
  const newRefresh = json?.refreshToken as string | undefined; // 회전(refresh rotation) 시
  if (!newAccess) return null;

  await setAccessToken(newAccess);
  if (newRefresh) await setRefreshToken(newRefresh);
  return newAccess;
}
------------------------------------------------------------------------------*/

// ── Public fetch wrapper ─────────────────────────────────────────────────────
export async function apiFetch(path: string, options: RequestInit = {}) {
  // B안: accessToken만 붙여 요청하고, 401이어도 여기서는 재발급 시도 X
  const token = await getAccessToken();
  const res = await doFetch(path, options, token || undefined);
  return res;

  /* ── A안 전환 시 아래 401 처리 블록 주석 해제 ─────────────────────────────
  if (res.status !== 401) return res;
  const refreshed = await tryRefreshOnce();
  if (!refreshed) return res;
  return doFetch(path, options, refreshed);
  ────────────────────────────────────────────────────────────────────────────*/
}

// ── Verb helpers (Response 반환) ─────────────────────────────────────────────
export function apiGet(path: string) {
  return apiFetch(path, { method: 'GET' });
}
export function apiPost(path: string, body?: any) {
  return apiFetch(path, {
    method: 'POST',
    body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
  });
}
export function apiPut(path: string, body?: any) {
  return apiFetch(path, {
    method: 'PUT',
    body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
  });
}
export function apiDelete(path: string) {
  return apiFetch(path, { method: 'DELETE' });
}

// ── JSON convenience ─────────────────────────────────────────────────────────
export async function apiGetJSON<T = any>(path: string): Promise<T> {
  const res = await apiGet(path);
  if (!res.ok) throw await toApiError(res);
  return (await safeJson(res)) as T;
}
export async function apiPostJSON<T = any>(path: string, body?: any): Promise<T> {
  const res = await apiPost(path, body);
  if (!res.ok) throw await toApiError(res);
  return (await safeJson(res)) as T;
}
export async function apiPutJSON<T = any>(path: string, body?: any): Promise<T> {
  const res = await apiPut(path, body);
  if (!res.ok) throw await toApiError(res);
  return (await safeJson(res)) as T;
}
export async function apiDeleteJSON<T = any>(path: string): Promise<T> {
  const res = await apiDelete(path);
  if (!res.ok) throw await toApiError(res);
  return (await safeJson(res)) as T;
}
