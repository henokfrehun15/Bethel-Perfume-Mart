import { Request, Response } from "express";
import {
  loginAdmin,
  updateAdminPassword,
  verifyAdminPassword,
} from "../services/authService";
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

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

/**
 * PUT /api/auth/password (admin)
 * Changes the signed-in admin's password. Tokens issued before the
 * change stop working (see requireAdmin), so other sessions must sign
 * in again — including this one, if the client does not refresh.
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

    return res.status(200).json({
      success: true,
      message:
        "Password updated. Other sessions have been signed out — sign in again with your new password.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};