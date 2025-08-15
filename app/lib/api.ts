import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://api.ldh.monster';

// Storage keys
const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const USER_ID_KEY = 'userId';

export async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_KEY);
}
export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_KEY);
}
export async function getUserId() {
  return AsyncStorage.getItem(USER_ID_KEY);
}
export async function setAccessToken(token: string) {
  await AsyncStorage.setItem(ACCESS_KEY, token);
}
export async function setRefreshToken(token: string) {
  await AsyncStorage.setItem(REFRESH_KEY, token);
}
export async function clearSession() {
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY, USER_ID_KEY]);
}

/* Internal utils */
function buildUrl(path: string) {
  return /^https?:\/\//.test(path) ? path : `${BASE_URL}${path}`;
}

function buildHeaders(options: RequestInit, token?: string) {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

/** 실제 fetch 수행 (Authorization 세팅 포함) */
async function doFetch(path: string, options: RequestInit, token?: string) {
  const url = buildUrl(path);
  const headers = buildHeaders(options, token);
  return fetch(url, { ...options, headers });
}

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function toApiError(res: Response) {
  let detail: any = '';
  try {
    detail = await res.clone().json();
  } catch {
    try {
      detail = await res.text();
    } catch {
      detail = '';
    }
  }
  const msgParts = [
    `${res.status} ${res.statusText}`,
    typeof detail === 'string' ? detail : detail?.message,
  ].filter(Boolean);
  return new Error(msgParts.join(' | '));
}

async function tryRefreshOnce(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  const uid = await getUserId();
  if (!refreshToken || !uid) return null;

  const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json'},
    body: JSON.stringify({ uid: Number(uid), refreshToken}),
  });
  if (!res.ok) return null;

  const json: any = await safeJson(res);
  const newAccess = json?.accessToken as string | undefined;
  const newRefresh = json?.refreshToken as string | undefined;
  if (!newAccess) return null;

  await setAccessToken(newAccess);
  if (newRefresh) await setRefreshToken(newRefresh);
  return newAccess;
}

/** 401 시 refresh(uid, refreshToken)로 새 accessToken 받아서 1회 재시도 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  const accessToken = await getAccessToken();
  let res = await doFetch(path, options, accessToken || undefined);

  if (res.status !== 401) return res;

  // 401 → 리프레시 시도
  const refreshed = await tryRefreshOnce();
  if (!refreshed) return res;

  // 새 토큰으로 원 요청 1회 재시도
  return doFetch(path, options, refreshed);
}

// Verb Helpers (Response 반환)
export function apiGet(path: string) {
  return apiFetch(path, { method: 'GET'});
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
  return apiFetch(path, { method: 'DELETE'});
}

// JSON Convenience
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