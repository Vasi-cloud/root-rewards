/** Maps Firebase Auth error codes to user-friendly messages. */
export function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: string }).code === "string"
      ? (error as { code: string }).code
      : null;

  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Try signing in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed. Please try again.";
    case "auth/popup-blocked":
      return "Popup was blocked by the browser. Allow popups for this site.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase. Add localhost to authorized domains.";
    default:
      return error instanceof Error ? error.message : "Something went wrong";
  }
}
