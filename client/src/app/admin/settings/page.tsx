"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "@/lib/api";

interface StoreSettings {
  store_name: string;
  whatsapp_number: string;
  description: string;
  contact_email: string;
  contact_address: string;
  delivery_fee: string;
}

interface SettingsResponse {
  success: boolean;
  data: StoreSettings;
}

interface MessageResponse {
  success: boolean;
  message: string;
}

export default function SettingsPage() {
  const [settings, setSettings] =
    useState<StoreSettings>({
      store_name: "",
      whatsapp_number: "",
      description: "",
      contact_email: "",
      contact_address: "",
      delivery_fee: "0",
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [currentPassword, setCurrentPassword] =
    useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [changingPassword, setChangingPassword] =
    useState(false);
  const [passwordError, setPasswordError] =
    useState("");
  const [passwordSuccess, setPasswordSuccess] =
    useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await apiRequest<SettingsResponse>(
            "/settings"
          );

        setSettings(response.data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load settings"
        );
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateField = (
    field: keyof StoreSettings,
    value: string
  ) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleChangePassword = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 8) {
      setPasswordError(
        "The new password must be at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "The new passwords do not match."
      );
      return;
    }

    setChangingPassword(true);

    try {
      const response =
        await apiRequest<MessageResponse>(
          "/auth/password",
          {
            method: "PUT",
            body: JSON.stringify({
              currentPassword,
              newPassword,
            }),
          }
        );

      setPasswordSuccess(
        response.message ||
          "Password updated."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? error.message
          : "Failed to change password"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!settings.store_name.trim()) {
        throw new Error(
          "Store name cannot be empty"
        );
      }

      const response =
        await apiRequest<SettingsResponse>(
          "/settings",
          {
            method: "PUT",
            body: JSON.stringify({
              store_name:
                settings.store_name.trim(),

              whatsapp_number:
                settings.whatsapp_number.trim(),

              description:
                settings.description.trim(),

              contact_email:
                settings.contact_email.trim(),

              contact_address:
                settings.contact_address.trim(),

              delivery_fee:
                settings.delivery_fee.trim(),
            }),
          }
        );

      setSettings(response.data);

      setSuccess(
        "Store settings saved successfully."
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save settings"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold">
          Store Settings
        </h2>

        <p className="mt-2 text-gray-500">
          Loading settings...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">
          Store Settings
        </h2>

        <p className="mt-1 text-gray-500">
          Manage your store information and
          contact details.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold">
            Store information
          </h3>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Store name *
              </label>

              <input
                value={settings.store_name}
                onChange={(event) =>
                  updateField(
                    "store_name",
                    event.target.value
                  )
                }
                required
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
                placeholder="Bethel Perfume"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Delivery fee (ETB)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.delivery_fee}
                onChange={(event) =>
                  updateField(
                    "delivery_fee",
                    event.target.value
                  )
                }
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
                placeholder="0"
              />

              <p className="mt-2 text-xs text-gray-500">
                Added to every order at checkout. Use 0
                for free delivery.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                WhatsApp number
              </label>

              <input
                value={
                  settings.whatsapp_number
                }
                onChange={(event) =>
                  updateField(
                    "whatsapp_number",
                    event.target.value
                  )
                }
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
                placeholder="+251 9XX XXX XXX"
              />

              <p className="mt-2 text-xs text-gray-500">
                Include the country code, for
                example +251.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Store description
              </label>

              <textarea
                value={settings.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
                rows={5}
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
                placeholder="Premium perfumes for every occasion..."
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold">
            Contact information
          </h3>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Contact email
              </label>

              <input
                type="email"
                value={
                  settings.contact_email
                }
                onChange={(event) =>
                  updateField(
                    "contact_email",
                    event.target.value
                  )
                }
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
                placeholder="info@example.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Contact address
              </label>

              <textarea
                value={
                  settings.contact_address
                }
                onChange={(event) =>
                  updateField(
                    "contact_address",
                    event.target.value
                  )
                }
                rows={3}
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
                placeholder="Addis Ababa, Ethiopia"
              />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Save settings"}
        </button>
      </form>

      <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Admin account
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Changing your password signs out every other
          session, including this browser.
        </p>

        <form
          onSubmit={handleChangePassword}
          className="mt-6 max-w-md space-y-4"
        >
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Current password
            </label>

            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(event.target.value)
              }
              className="mt-1 w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700"
            >
              New password
            </label>

            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              className="mt-1 w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
            />

            <p className="mt-1 text-xs text-gray-500">
              At least 8 characters.
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm new password
            </label>

            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              className="mt-1 w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
            />
          </div>

          {passwordError && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {passwordError}
            </p>
          )}

          {passwordSuccess && (
            <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {passwordSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={changingPassword}
            className="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {changingPassword
              ? "Updating..."
              : "Change password"}
          </button>
        </form>
      </section>
    </div>
  );
}