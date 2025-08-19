import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://api.ldh.monster';

// Storage keys (네 코드와 동일하게)
const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const USER_ID_KEY = 'userId';

async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_KEY);
}
async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_KEY);
}
async function getUserId() {
  return AsyncStorage.getItem(USER_ID_KEY);
}
async function setAccessToken(token: string) {
  await AsyncStorage.setItem(ACCESS_KEY, token);
}
export async function clearSession() {
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY, USER_ID_KEY]);
}

/** 실제 fetch 수행 (Authorization 세팅 포함) */
async function doFetch(path: string, options: RequestInit, token?: string) {
  const isAbsolute = /^https?:\/\//.test(path);
  const url = isAbsolute ? path : `${BASE_URL}${path}`;

  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  // body가 있고 FormData가 아니면 Content-Type 기본값 설정
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, { ...options, headers });
}

/** 401 시 refresh(uid, refreshToken)로 새 accessToken 받아서 1회 재시도 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  const accessToken = await getAccessToken();
  let res = await doFetch(path, options, accessToken || undefined);

  if (res.status !== 401) return res;

  // 401 → 리프레시 시도
  const refreshToken = await getRefreshToken();
  const uid = await getUserId();
  if (!refreshToken || !uid) return res;

  const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ uid: Number(uid), refreshToken }),
  });

  if (!refreshRes.ok) return res;

  const refreshJson = await refreshRes.json(); // { accessToken: '...' } 예상
  if (!refreshJson?.accessToken) return res;

  await setAccessToken(refreshJson.accessToken);

  // 새 토큰으로 원 요청 1회 재시도
  return doFetch(path, options, refreshJson.accessToken);
}

/** 편의 함수들 */
export async function apiGet(path: string) {
  return apiFetch(path, { method: 'GET' });
}
export async function apiPost(path: string, body?: any) {
  return apiFetch(path, {
    method: 'POST',
    body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
  });
}
export async function apiPut(path: string, body?: any) {
  return apiFetch(path, {
    method: 'PUT',
    body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
  });
}
export async function apiDelete(path: string) {
  return apiFetch(path, { method: 'DELETE' });
}
