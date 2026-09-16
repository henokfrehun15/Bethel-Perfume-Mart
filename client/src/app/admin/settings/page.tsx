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
}

interface SettingsResponse {
  success: boolean;
  data: StoreSettings;
}

export default function SettingsPage() {
  const [settings, setSettings] =
    useState<StoreSettings>({
      store_name: "",
      whatsapp_number: "",
      description: "",
      contact_email: "",
      contact_address: "",
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
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
    </div>
  );
}