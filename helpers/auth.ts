import { getCookie } from "cookies-next";
import { Member } from "@/types/user";

export enum AUTH_STORED_DATA {
  TOKEN = "auth_token",
  USER = "auth_user_data",
}

const safeParseJSON = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const getUser = (): Member | null => {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem(AUTH_STORED_DATA?.USER);
  return safeParseJSON<Member>(user);
};

export const getCookieUser = (): Member | null => {
  const user = getCookie(AUTH_STORED_DATA?.USER);
  return safeParseJSON<Member>(typeof user === "string" ? user : null);
};

export const getUserOrCache = (): Member | null => {
  return getUser() ?? getCookieUser();
};

export const token = () => getCookie(AUTH_STORED_DATA?.TOKEN);

export const isAuthenticated = () => {
  const user = getUser();
  const authToken = getCookie(AUTH_STORED_DATA?.TOKEN);
  return user && authToken ? true : false;
};
