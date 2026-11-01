"use client";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LoaderCircle, LogOut } from "lucide-react";
import { useLogoutMutation, useMeQuery, userApi } from "@/entities/user";
import { apiErrorMessage } from "@/shared/api/error-message";
import { Button } from "@/shared/ui/button";
import styles from "./logout-button.module.css";
export function LogoutButton() {
  const [logout, { isLoading }] = useLogoutMutation();
  const [leaving, setLeaving] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  useMeQuery(undefined, { pollingInterval: 60000, refetchOnFocus: true, refetchOnReconnect: true });
  async function exit() {
    if (isLoading || leaving) return;
    try {
      await logout().unwrap();
      setLeaving(true);
      dispatch(userApi.util.resetApiState());
      toast.success("از حساب کاربری خارج شدید.");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }
  return (
    <Button
      type="button"
      variant="ghost"
      className={styles.logout}
      aria-label={isLoading || leaving ? "در حال خروج" : "خروج از حساب"}
      title="خروج از حساب"
      disabled={isLoading || leaving}
      aria-busy={isLoading || leaving}
      onClick={exit}
    >
      {isLoading || leaving ? (
        <LoaderCircle
          className="size-4 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      ) : (
        <LogOut className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}
