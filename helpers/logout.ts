import { deleteCookie } from "cookies-next";
import { AUTH_STORED_DATA } from "./auth";

export const logout = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_STORED_DATA.USER);
  }

  deleteCookie(AUTH_STORED_DATA.TOKEN);
  deleteCookie(AUTH_STORED_DATA.USER);
};
