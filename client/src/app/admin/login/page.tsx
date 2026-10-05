"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, setAdminUser } from "@/lib/api";

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    admin: {
      id: number;
      username: string;
    };
  };
}

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response =
        await apiRequest<LoginResponse>(
          "/auth/login",
          {
            method: "POST",
            body: JSON.stringify({
              username,
              password,
            }),
          }
        );

      // The session token itself is set by the API as an httpOnly
      // cookie; only the display username is stored client-side.
      setAdminUser(response.data.admin);

      router.push("/admin");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bethel-page flex min-h-screen items-center justify-center bg-background px-4 py-12">
      {/* Decorative background */}
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-primary-light opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full bg-primary-light opacity-40 blur-3xl" />

      <div className="bethel-card relative w-full max-w-md p-8 sm:p-10">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-dark">
            Bethel Perfume
          </p>

          <h1 className="bethel-heading mt-2 text-3xl">
            Admin sign in
          </h1>

          <p className="bethel-muted mt-2 text-sm">
            Manage your store
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="username"
              className="bethel-label"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              required
              autoComplete="username"
              className="bethel-input"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="bethel-label"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              autoComplete="current-password"
              className="bethel-input"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <div className="bethel-alert bethel-alert-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bethel-button bethel-button-primary w-full"
          >
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}