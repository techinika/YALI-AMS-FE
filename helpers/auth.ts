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
  const user =
    typeof window !== "undefined"
      ? localStorage.getItem(AUTH_STORED_DATA?.USER)
      : null;
  return safeParseJSON<Member>(user);
};

export const getCookieUser = (): Member | null => {
  const user = getCookie(AUTH_STORED_DATA?.USER);
  return safeParseJSON<Member>(typeof user === "string" ? user : null);
};

export const token = () => getCookie(AUTH_STORED_DATA?.TOKEN);

export const isAuthenticated = () => {
  const user = getUser();
  const authToken = getCookie(AUTH_STORED_DATA?.TOKEN);
  return user && authToken ? true : false;
};
