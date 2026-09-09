import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Member } from "@/types/user";

interface AuthState {
  token: string | null;
  user: Member | null;
  isAuthenticated: boolean;
  sessionExpired: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  sessionExpired: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: Member }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    processLogout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
    },
    markSessionExpired: (state) => {
      state.sessionExpired = true;
    },
    clearSessionExpired: (state) => {
      state.sessionExpired = false;
    },
  },
});

export const { setCredentials, processLogout, markSessionExpired, clearSessionExpired } =
  authSlice.actions;
export default authSlice.reducer;
