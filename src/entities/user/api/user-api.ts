import { baseApi } from "@/shared/api/base-api";
import type { User } from "../model/types";

export type RegisterInput = {
  username: string;
  displayName: string;
  email?: string;
  phone?: string;
  password: string;
};
export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    me: builder.query<{ user: User }, void>({ query: () => "me", providesTags: ["CurrentUser"] }),
    login: builder.mutation<{ user: User }, { username: string; password: string }>({
      query: (body) => ({ url: "login", method: "POST", body }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          await dispatch(userApi.util.upsertQueryData("me", undefined, data));
        } catch {
          /* The form handles request errors. */
        }
      },
    }),
    register: builder.mutation<{ user: User }, RegisterInput>({
      query: (body) => ({ url: "register", method: "POST", body }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          await dispatch(userApi.util.upsertQueryData("me", undefined, data));
        } catch {
          /* The form handles request errors. */
        }
      },
    }),
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({ url: "logout", method: "POST", body: {} }),
    }),
    forgetPassword: builder.mutation<{ message: string }, { email: string }>({
      query: (body) => ({ url: "forget-password", method: "POST", body }),
    }),
    resetPassword: builder.mutation<{ message: string }, { token: string; password: string }>({
      query: (body) => ({ url: "reset-password", method: "POST", body }),
    }),
  }),
});
export const {
  useMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useForgetPasswordMutation,
  useResetPasswordMutation,
} = userApi;
