"use client";

// ==============================================================================
// OpenDX-Lab Dashboard - Global Error Boundary
// This page renders OUTSIDE the root layout, so no providers are available.
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Something went wrong</h1>
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>{error.message}</p>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1.5rem",
            border: "1px solid #ddd",
            borderRadius: "0.5rem",
            cursor: "pointer",
            background: "#f5f5f5",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
