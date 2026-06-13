"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type VerifyState = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setState("error");
      setMessage("No verification token found in the URL.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email?token=${token}`,
        );
        const data = await res.json();

        if (res.ok) {
          setState("success");
          setMessage(data.message || "Email verified successfully.");
          setTimeout(() => {
            window.location.href = "/login";
          }, 3000);
        } else {
          setState("error");
          setMessage(data.message || "Verification failed.");
        }
      } catch {
        setState("error");
        setMessage("A network error occurred. Please try again.");
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "#0B1120" }}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-8 text-center"
        style={{ backgroundColor: "#111827", borderColor: "#1F2937" }}
      >
        {state === "loading" && (
          <>
            <div
              className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"
              style={{ borderColor: "#4A9EFF", borderTopColor: "transparent" }}
            />
            <p className="text-lg font-medium" style={{ color: "#E5E7EB" }}>
              Verifying your email...
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: "#052e16" }}
            >
              <svg
                className="h-8 w-8"
                style={{ color: "#22c55e" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="mb-3 text-2xl font-bold" style={{ color: "#22c55e" }}>
              Email Verified!
            </h1>
            <p className="mb-2 text-base" style={{ color: "#E5E7EB" }}>
              {message}
            </p>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Redirecting you to login in 3 seconds...
            </p>
          </>
        )}

        {state === "error" && (
          <>
            <div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: "#450a0a" }}
            >
              <svg
                className="h-8 w-8"
                style={{ color: "#ef4444" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="mb-3 text-2xl font-bold" style={{ color: "#ef4444" }}>
              Verification Failed
            </h1>
            <p className="mb-6 text-base" style={{ color: "#E5E7EB" }}>
              {message}
            </p>
            <a
              href="/register"
              className="inline-block rounded-lg px-6 py-3 font-semibold text-white"
              style={{ backgroundColor: "#4A9EFF" }}
            >
              Back to Register
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ backgroundColor: "#0B1120" }}
        >
          <div
            className="h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: "#4A9EFF", borderTopColor: "transparent" }}
          />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
