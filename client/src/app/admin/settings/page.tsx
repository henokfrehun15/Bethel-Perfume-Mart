"use client";

import {
  FormEvent,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Skeleton from "@/components/Skeleton";

import { apiRequest } from "@/lib/api";

/* Figma AdminHeader: eyebrow + serif title, notification bell + action. */
function AdminHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="admin-head">
      <div>
        <span>{eyebrow}</span>

        <h1>{title}</h1>
      </div>

      <div className="admin-head-actions">
        <button className="notification" aria-label="Notifications">
          ○<i />
        </button>

        {action}
      </div>
    </div>
  );
}

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
        <Skeleton className="h-8 w-44" />

        <Skeleton className="mt-3 h-4 w-72" />

        <div className="mt-8 space-y-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminHeader
        eyebrow="Configuration"
        title="Store settings"
      />

      {error && (
        <div className="bethel-alert bethel-alert-error mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bethel-alert bethel-alert-success mb-4">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="settings-grid"
      >
        {/* Store information card, mirroring the Figma settings card */}
        <section className="admin-card">
          <div className="card-head">
            <div>
              <h3>Store information</h3>

              <p>
                Public details used across your
                storefront.
              </p>
            </div>
          </div>

          <div style={{ padding: "0 22px 22px" }}>
            <label className="field">
              <span>Store name *</span>

              <input
                value={settings.store_name}
                onChange={(event) =>
                  updateField(
                    "store_name",
                    event.target.value
                  )
                }
                required
                placeholder="Bethel Perfume"
              />
            </label>

            <label className="field">
              <span>Delivery fee (ETB)</span>

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
                placeholder="200"
              />

              <small style={{ color: "#9B9093" }}>
                Added to every order at checkout. Use 0
                for free delivery.
              </small>
            </label>

            <label className="field">
              <span>WhatsApp number</span>

              <input
                value={settings.whatsapp_number}
                onChange={(event) =>
                  updateField(
                    "whatsapp_number",
                    event.target.value
                  )
                }
                placeholder="+251 911 000 000"
              />
            </label>

            <label className="field">
              <span>Store description</span>

              <textarea
                value={settings.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
                rows={4}
                placeholder="Premium perfumes for every occasion..."
              />
            </label>
          </div>
        </section>

        <section className="admin-card">
          <div className="card-head">
            <div>
              <h3>Contact information</h3>

              <p>
                Shown on your storefront contact
                page.
              </p>
            </div>
          </div>

          <div style={{ padding: "0 22px 22px" }}>
            <label className="field">
              <span>Contact email</span>

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
                placeholder="you@store.com"
              />
            </label>

            <label className="field">
              <span>Contact address</span>

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
                placeholder="Addis Ababa, Ethiopia"
              />
            </label>
          </div>
        </section>

        <div className="form-actions">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
          >
            {saving
              ? "Saving..."
              : "Save store information"}
          </button>
        </div>
      </form>

      <section
        className="admin-card"
        style={{ marginTop: 22 }}
      >
        <div className="card-head">
          <div>
            <h3>Admin account</h3>

            <p>
              Changing your password signs out every
              other session, including this browser.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleChangePassword}
          style={{
            padding: "0 22px 22px",
            maxWidth: 420,
          }}
        >
          <label className="field">
            <span>Current password</span>

            <input
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(event.target.value)
              }
            />
          </label>

          <div className="form-grid">
            <label className="field">
              <span>New password</span>

              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
              />
            </label>

            <label className="field">
              <span>Confirm new password</span>

              <input
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
              />
            </label>
          </div>

          {passwordError && (
            <div className="bethel-alert bethel-alert-error">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="bethel-alert bethel-alert-success">
              {passwordSuccess}
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              disabled={changingPassword}
              className="btn btn-primary"
            >
              {changingPassword
                ? "Updating..."
                : "Change password"}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}