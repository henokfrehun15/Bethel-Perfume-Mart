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

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      // The session token itself is set by the API as an httpOnly
      // cookie; only the display username is stored client-side.
      setAdminUser(response.data.admin);

      router.push("/admin");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      {/* Art side */}
      <div className="login-art">
        <img
          src="https://images.unsplash.com/photo-1615108395437-df128ad79e80?auto=format&fit=crop&w=900&q=85"
          alt="Luxury perfume and white flowers"
        />

        <div className="login-brand">
          <span>B</span>

          <h1>
            Bethel
            <br />
            <em>Perfume &amp; Mart</em>
          </h1>

          <p>Beauty, thoughtfully curated.</p>
        </div>
      </div>

      {/* Form side */}
      <div className="login-panel">
        <form onSubmit={handleSubmit}>
          <span className="eyebrow">Welcome back</span>

          <h2>Sign in to your store</h2>

          <p>
            Enter your details to manage Bethel Perfume &amp; Mart.
          </p>

          <label className="field">
            <span>Username</span>

            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              autoComplete="username"
              placeholder="Enter your username"
            />
          </label>

          <label className="field">
            <span>Password</span>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
            />
          </label>

          {error && (
            <div className="field error">
              <input value={error} readOnly style={{ display: "none" }} />

              <small>{error}</small>
            </div>
          )}

          <label className="remember">
            <input type="checkbox" /> Keep me signed in
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%" }}
          >
            {loading ? "Signing in..." : <>Sign in securely →</>}
          </button>

          <small>Protected admin access · JWT secured</small>

          <noscript>
            <p style={{ color: "#B94A5C" }}>
              JavaScript is required to sign in.
            </p>
          </noscript>
        </form>
      </div>
    </main>
  );
}
