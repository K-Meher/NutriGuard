// ============================================================
// Firebase Phone Authentication Service (SSR Safe + Robust reCAPTCHA)
// ============================================================
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "./firebase";
export { isFirebaseConfigured };

/**
 * Initialize or retrieve the invisible reCAPTCHA verifier.
 * Calls .render() to pre-warm it so the token is ready when sendOtp fires.
 */
export function setupRecaptcha(): RecaptchaVerifier | null {
  if (typeof window === "undefined") return null;

  const auth = getFirebaseAuth();
  if (!auth) return null;

  const win = window as any;

  // Return existing active verifier if available
  if (win.recaptchaVerifier) {
    return win.recaptchaVerifier;
  }

  // Ensure recaptcha-container exists and is clean
  let el = document.getElementById("recaptcha-container");
  if (el) {
    el.innerHTML = "";
  } else {
    el = document.createElement("div");
    el.id = "recaptcha-container";
    el.style.position = "absolute";
    el.style.bottom = "0";
    el.style.right = "0";
    document.body.appendChild(el);
  }

  try {
    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved
      },
      "expired-callback": () => {
        clearRecaptcha();
      },
    });
    // Pre-render so the token is ready immediately when we call signInWithPhoneNumber
    verifier.render().then(() => {
      console.log("✅ reCAPTCHA pre-rendered successfully");
    }).catch((err: unknown) => {
      console.warn("reCAPTCHA render warning (non-fatal):", err);
    });
    win.recaptchaVerifier = verifier;
    return verifier;
  } catch (e) {
    // If element was already bound by grecaptcha, replace DOM node and retry
    console.warn("Resetting reCAPTCHA container after bind collision:", e);
    try {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
      const freshEl = document.createElement("div");
      freshEl.id = "recaptcha-container";
      freshEl.style.position = "absolute";
      freshEl.style.bottom = "0";
      freshEl.style.right = "0";
      document.body.appendChild(freshEl);

      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => { clearRecaptcha(); },
      });
      verifier.render().catch(() => {});
      win.recaptchaVerifier = verifier;
      return verifier;
    } catch (e2) {
      console.error("RecaptchaVerifier fallback failed:", e2);
      return null;
    }
  }
}

/**
 * Pre-load reCAPTCHA on component mount (call from useEffect).
 * Safe to call multiple times — only initializes once.
 */
export function preloadRecaptcha(): void {
  if (typeof window === "undefined") return;
  if (!isFirebaseConfigured) return;
  const win = window as any;
  if (win.recaptchaVerifier) return;
  setupRecaptcha();
}

/**
 * Reset reCAPTCHA completely so the next attempt starts clean.
 */
export function clearRecaptcha(): void {
  if (typeof window === "undefined") return;
  const win = window as any;
  if (win.recaptchaVerifier) {
    try {
      win.recaptchaVerifier.clear();
    } catch {
      // ignore
    }
    win.recaptchaVerifier = null;
  }
  const el = document.getElementById("recaptcha-container");
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

/**
 * Send a real OTP via Firebase Phone Authentication.
 */
export async function sendOtp(
  phoneNumber: string,
): Promise<{ success: true; confirmationResult: ConfirmationResult } | { success: false; error: string }> {
  if (!isFirebaseConfigured) {
    return {
      success: false,
      error: "Firebase is not configured yet.",
    };
  }

  if (typeof window === "undefined") {
    return { success: false, error: "Phone authentication can only be performed in the browser." };
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    return { success: false, error: "Firebase authentication is unavailable." };
  }

  try {
    const verifier = setupRecaptcha();
    if (!verifier) {
      return { success: false, error: "Could not initialize Google reCAPTCHA. Please refresh the page and try again." };
    }

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      verifier,
    );
    return { success: true, confirmationResult };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send OTP";

    // Clean up reCAPTCHA on failure so subsequent attempts succeed
    clearRecaptcha();

    if (msg.includes("configuration-not-found") || msg.includes("operation-not-allowed")) {
      return {
        success: false,
        error: "Phone Authentication is not enabled yet in your Firebase project! Go to Firebase Console → Authentication → Sign-in method → Phone → Enable → Save.",
      };
    }
    if (msg.includes("invalid-phone-number")) {
      return { success: false, error: "Invalid phone number format. Please include country code, e.g. +91 9014628803." };
    }
    if (msg.includes("too-many-requests")) {
      return { success: false, error: "Too many SMS requests sent to this number recently. Please wait a few minutes." };
    }
    if (msg.includes("quota-exceeded")) {
      return { success: false, error: "Firebase daily SMS quota exceeded for today." };
    }
    if (msg.includes("already been rendered")) {
      return { success: false, error: "reCAPTCHA reset. Please click Continue again." };
    }

    return { success: false, error: msg || "Failed to send OTP. Please check your number." };
  }
}

/**
 * Verify the OTP entered by the user.
 */
export async function verifyOtp(
  confirmationResult: ConfirmationResult,
  otp: string,
): Promise<{ success: true; user: User } | { success: false; error: string }> {
  try {
    const result = await confirmationResult.confirm(otp);
    clearRecaptcha();
    return { success: true, user: result.user };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("invalid-verification-code") || msg.includes("code-expired")) {
      return { success: false, error: "Incorrect or expired OTP. Please check and try again." };
    }
    return { success: false, error: "OTP verification failed. Please try again." };
  }
}

/**
 * Sign out the current user.
 */
export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) {
    await auth.signOut();
  }
}

/**
 * Get current user in browser.
 */
export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth();
  return auth?.currentUser ?? null;
}
