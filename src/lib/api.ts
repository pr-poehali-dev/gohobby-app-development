const AUTH_URL = 'https://functions.poehali.dev/9c97a63a-bd6e-40e7-b744-d0f1cbf1e1d5';
const PROFILE_URL = 'https://functions.poehali.dev/fb64e669-8d51-4f8f-99bc-155f0be21e24';

const REDIRECT_URI = `${window.location.origin}/auth/yandex/callback`;

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar: string;
  birthDate?: string | null;
  hobbies: string[];
  photos: string[];
  rating: number;
}

export function getToken() {
  return localStorage.getItem('gh_token');
}

export function logout() {
  localStorage.removeItem('gh_token');
}

export async function startYandexLogin() {
  const res = await fetch(`${AUTH_URL}?action=config`);
  const data = await res.json();
  if (!data.clientId) {
    throw new Error('no_client_id');
  }
  const url = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${data.clientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  window.location.href = url;
}

export async function exchangeCode(code: string): Promise<UserProfile> {
  const res = await fetch(`${AUTH_URL}?action=callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri: REDIRECT_URI }),
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('gh_token', data.token);
  }
  return data.user;
}

export async function getProfile(): Promise<UserProfile | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(PROFILE_URL, { headers: { 'X-Auth-Token': token } });
  if (res.status === 401) {
    logout();
    return null;
  }
  return res.json();
}

export async function saveProfile(p: {
  name?: string;
  birthDate?: string | null;
  hobbies?: string[];
  photos?: string[];
}) {
  const token = getToken();
  await fetch(PROFILE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token || '' },
    body: JSON.stringify(p),
  });
}
