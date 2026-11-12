export async function saveVerifiedBackup(
  result: { filename: string; sha256: string; content: string },
  expectedSha256: string,
) {
  const bytes = Uint8Array.from(atob(result.content), (char) => char.charCodeAt(0));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const checksum = Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  if (checksum !== result.sha256 || checksum !== expectedSha256) throw new Error("checksum");
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = result.filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
