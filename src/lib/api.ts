const AUTH_URL = 'https://functions.poehali.dev/9c97a63a-bd6e-40e7-b744-d0f1cbf1e1d5';
const PROFILE_URL = 'https://functions.poehali.dev/fb64e669-8d51-4f8f-99bc-155f0be21e24';
const ACTIVITIES_URL = 'https://functions.poehali.dev/15d1d9a8-72db-4fd3-82b4-1ed456a96c70';
const UPLOAD_URL = 'https://functions.poehali.dev/aef5f53e-3f1c-4ce3-a18c-ee53dd8864c7';

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

export interface ActivityCard {
  id: number;
  hobby: string;
  description: string;
  date: string;
  time: string;
  place: string;
  spots_total: number;
  spots_left: number;
  photo_url: string | null;
  creator_name: string;
  creator_avatar: string | null;
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
  if (!data.clientId) throw new Error('no_client_id');
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
  if (data.token) localStorage.setItem('gh_token', data.token);
  return data.user;
}

export async function getProfile(): Promise<UserProfile | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(PROFILE_URL, { headers: { 'X-Auth-Token': token } });
  if (res.status === 401) { logout(); return null; }
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

export async function getFeed(): Promise<ActivityCard[]> {
  const token = getToken();
  const res = await fetch(`${ACTIVITIES_URL}?action=feed`, {
    headers: { 'X-Auth-Token': token || '' },
  });
  const data = await res.json();
  return data.cards || [];
}

export async function swipeActivity(activityId: number, action: 'join' | 'skip') {
  const token = getToken();
  const res = await fetch(`${ACTIVITIES_URL}?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token || '' },
    body: JSON.stringify({ activityId }),
  });
  return res.json();
}

export async function createActivity(data: {
  hobby: string;
  description: string;
  date: string;
  time: string;
  place: string;
  spots: number;
  photoUrl?: string | null;
}) {
  const token = getToken();
  const res = await fetch(`${ACTIVITIES_URL}?action=create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token || '' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getMyActivities(): Promise<(ActivityCard & { is_active: boolean; joined_count: number })[]> {
  const token = getToken();
  const res = await fetch(`${ACTIVITIES_URL}?action=mine`, {
    headers: { 'X-Auth-Token': token || '' },
  });
  const data = await res.json();
  return data.activities || [];
}

export async function uploadPhoto(dataUrl: string): Promise<string> {
  const token = getToken();
  const res = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token || '' },
    body: JSON.stringify({ dataUrl }),
  });
  const data = await res.json();
  if (!data.url) throw new Error(data.message || 'upload_failed');
  return data.url;
}