import { Request, Response } from "express";
import {
  loginAdmin,
  signAdminToken,
  updateAdminPassword,
  verifyAdminPassword,
} from "../services/authService";
import {
  clearAdminCookie,
  setAdminCookie,
} from "../services/sessionCookie";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const result = await loginAdmin(username, password);

    if (!result) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // The token lives in an httpOnly cookie, never in the response
    // body, so client-side script (and therefore XSS) cannot read it.
    setAdminCookie(res, result.token);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { admin: result.admin },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// POST /api/auth/logout
// Clears the httpOnly session cookie. Safe to call unauthenticated:
// an already-empty session is the desired end state.
export const logout = (_req: Request, res: Response) => {
  clearAdminCookie(res);

  return res.status(200).json({
    success: true,
    message: "Logged out",
  });
};

/**
 * PUT /api/auth/password (admin)
 * Changes the signed-in admin's password. Tokens issued before the
 * change stop working (see requireAdmin), so other sessions must sign
 * in again; this session's cookie is refreshed so the admin stays
 * signed in.
 */
export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const adminId = req.admin?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { currentPassword, newPassword } =
      req.body as {
        currentPassword?: string;
        newPassword?: string;
      };

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Current password and new password are required",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "The new password must be different from the current one",
      });
    }

    const matches = await verifyAdminPassword(
      adminId,
      currentPassword
    );

    if (!matches) {
      return res.status(401).json({
        success: false,
        message: "Your current password is incorrect",
      });
    }

    const updated = await updateAdminPassword(
      adminId,
      newPassword
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found",
      });
    }

    // Tokens issued before the change are now stale. Refresh this
    // session's cookie so the admin who changed the password stays
    // signed in; every other session must sign in again.
    setAdminCookie(
      res,
      signAdminToken({
        id: adminId,
        username: req.admin!.username,
      })
    );

    return res.status(200).json({
      success: true,
      message:
        "Password updated. Other sessions have been signed out.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};