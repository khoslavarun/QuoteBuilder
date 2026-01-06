import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "http://localhost:8000",
});

export async function get<T>(url: string) {
  const res = await api.get<T>(url);
  return res.data;
}

export async function post<T>(url: string, data?: any) {
  const res = await api.post<T>(url, data);
  return res.data;
}

export async function put<T>(url: string, data?: any) {
  const res = await api.put<T>(url, data);
  return res.data;
}

export async function del(url: string) {
  await api.delete(url);
}
