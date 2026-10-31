export function apiErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "data" in error && error.data && typeof error.data === "object" && "message" in error.data) {
    const message = error.data.message;
    if (typeof message === "string") return message === "ThrottlerException: Too Many Requests" ? "تعداد تلاش‌ها زیاد است. کمی بعد دوباره امتحان کنید." : message;
    if (Array.isArray(message)) return message.filter(item => typeof item === "string").join(" ");
  }
  return "ارتباط با سامانه برقرار نشد. دوباره تلاش کنید.";
}
