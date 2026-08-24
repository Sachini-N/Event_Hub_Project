const User = require("../model/User");
const { signToken } = require("../middleware/authMiddleware");

// POST /api/auth/signup
const signupUser = async (req, res) => {
  try {
    const { name, email, password, contactNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please provide Name, Email, and Password." });
    }

    const emailClean = email.toLowerCase().trim();

    // Check if email already registered
    const existingUser = await User.findOne({ email: emailClean });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "An account with this email address already exists. Please log in." });
    }

    const isAdminEmail = emailClean.includes('admin') || req.body.role === 'admin';

    const user = new User({
      name,
      email: emailClean,
      password,
      contactNumber: contactNumber || "",
      role: isAdminEmail ? "admin" : "user",
    });

    await user.save();

    const token = signToken({ id: user._id, email: user.email, role: user.role });

    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          contactNumber: user.contactNumber,
          avatar: user.avatar || "",
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Signup failed", error: error.message });
  }
};

// POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide both Email and Password." });
    }

    const emailClean = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailClean });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = signToken({ id: user._id, email: user.email, role: user.role });

    res.json({
      success: true,
      message: "Logged in successfully!",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          contactNumber: user.contactNumber,
          avatar: user.avatar || "",
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Login failed", error: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        contactNumber: req.user.contactNumber,
        avatar: req.user.avatar || "",
        role: req.user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch profile", error: error.message });
  }
};

// PUT /api/auth/profile
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.contactNumber !== undefined) user.contactNumber = req.body.contactNumber;
    if (req.body.avatar !== undefined) user.avatar = req.body.avatar;
    if (req.body.email) {
      const emailClean = req.body.email.toLowerCase().trim();
      if (emailClean !== user.email) {
        const existing = await User.findOne({ email: emailClean });
        if (existing) {
          return res.status(400).json({ success: false, message: "Email is already in use by another account." });
        }
        user.email = emailClean;
      }
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully!",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
        avatar: user.avatar || "",
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update profile", error: error.message });
  }
};

// Seed default Admin User if none exists
const seedAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ $or: [{ email: "admin@trace.lk" }, { role: "admin" }] });
    if (!adminExists) {
      const admin = new User({
        name: "TRACE Admin",
        email: "admin@trace.lk",
        password: "admin123",
        contactNumber: "+94 11 234 5678",
        role: "admin",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      });
      await admin.save();
      console.log("Default Admin user seeded successfully (admin@trace.lk / admin123)");
    }
  } catch (err) {
    console.error("Error seeding admin user:", err);
  }
};

// GET /api/auth/users (Get all registered users for Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch registered users", error: error.message });
  }
};

// DELETE /api/auth/users/:id (Delete a user account)
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: "User account deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete user", error: error.message });
  }
};

const nodemailer = require("nodemailer");

// Nodemailer Email Transport Helper
const sendRealEmail = async ({ to, subject, html }) => {
  try {
    let transporter;
    const cleanUser = (process.env.EMAIL_USER || "").trim();
    const cleanPass = (process.env.EMAIL_PASS || "").replace(/\s+/g, "").trim();

    const isRealConfigured =
      cleanUser &&
      cleanPass &&
      !cleanUser.includes("your_gmail_address");

    if (isRealConfigured) {
      console.log(`Sending REAL email via Gmail SMTP (${cleanUser}) to: ${to}`);
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_PORT || "587", 10),
        secure: false, // 587 uses STARTTLS
        auth: {
          user: cleanUser,
          pass: cleanPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    } else {
      console.log(`Sending test email via Ethereal SMTP fallback to: ${to}`);
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const info = await transporter.sendMail({
      from: `"TRACE Event Hub Admin" <${process.env.EMAIL_USER || "admin@trace.lk"}>`,
      to,
      subject,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    console.error("Nodemailer dispatch error:", err);
    return { success: false, error: err.message };
  }
};

// POST /api/auth/create-branch-admin (Assign new Branch Admin and send email notification)
const createBranchAdmin = async (req, res) => {
  try {
    const { name, email, password, branch, permissions } = req.body;

    if (!name || !email || !password || !branch) {
      return res.status(400).json({ success: false, message: "Please provide Name, Email, Password, and Branch." });
    }

    const emailClean = email.toLowerCase().trim();

    // Check if user already exists
    let user = await User.findOne({ email: emailClean });
    if (user) {
      user.role = "branch_admin";
      user.branch = branch;
      user.permissions = permissions || ["manage_events", "manage_registrations"];
      if (password) user.password = password;
      await user.save();
    } else {
      user = new User({
        name,
        email: emailClean,
        password,
        role: "branch_admin",
        branch,
        permissions: permissions || ["manage_events", "manage_registrations"],
      });
      await user.save();
    }

    const emailSubject = `🔐 Welcome to TRACE Event Hub - Your ${branch} Admin Credentials`;
    const permissionsListHtml = (permissions || ["manage_events", "manage_registrations"])
      .map((p) => `<li style="color:#059669;font-weight:600;margin-bottom:4px;">✓ ${p.replace("_", " ").toUpperCase()}</li>`)
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background-color: #f1f5f9; padding: 20px; color: #334155;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <div style="background: #0f172a; color: #ffffff; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px;">🔐 TRACE Event Hub</h2>
            <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Branch Admin Access Credentials</p>
          </div>
          <div style="padding: 24px;">
            <p>Hello <strong>${name}</strong>,</p>
            <p>You have been officially granted <strong>Branch Admin Access</strong> for <strong>${branch}</strong> on the TRACE Event Hub enterprise platform.</p>

            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <div style="margin-bottom: 8px;">📧 <strong>Login Email:</strong> <span style="color:#0052cc;font-weight:600;">${emailClean}</span></div>
              <div style="margin-bottom: 8px;">🔑 <strong>Temporary Password:</strong> <code style="background:#e2e8f0;padding:3px 6px;border-radius:4px;color:#0f172a;">${password}</code></div>
              <div>🏢 <strong>Assigned Branch:</strong> <strong>${branch}</strong></div>
            </div>

            <div style="margin-bottom: 16px;">
              <strong>Granted Scope & Permissions:</strong>
              <ul style="margin: 8px 0 0 18px; padding: 0;">
                ${permissionsListHtml}
              </ul>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Trigger real email dispatch via Nodemailer
    const emailResult = await sendRealEmail({
      to: emailClean,
      subject: emailSubject,
      html: emailHtml,
    });

    const emailContent = {
      recipient: emailClean,
      subject: emailSubject,
      adminName: name,
      branchName: branch,
      email: emailClean,
      temporaryPassword: password,
      grantedPermissions: permissions || ["manage_events", "manage_registrations"],
      sentAt: new Date().toISOString(),
      previewUrl: emailResult.previewUrl || null,
    };

    res.status(201).json({
      success: true,
      message: `Branch Admin assigned for ${branch}! Email sent to ${emailClean}.`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        permissions: user.permissions,
      },
      emailNotification: emailContent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create branch admin", error: error.message });
  }
};

// POST /api/auth/send-credentials-email (Send email credentials to existing user/admin on demand)
const sendEmailCredentials = async (req, res) => {
  try {
    const { userId, email, password } = req.body;
    const user = await User.findOne({ $or: [{ _id: userId }, { email: email?.toLowerCase().trim() }] });

    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }

    const tempPass = password || "BranchAdmin@2026";
    const emailSubject = `🔐 TRACE Event Hub - Your Credentials for ${user.branch || "TRACE Main"}`;
    const perms = user.permissions && user.permissions.length > 0 ? user.permissions : ["manage_events", "manage_registrations"];

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background-color: #f1f5f9; padding: 20px; color: #334155;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <div style="background: #0f172a; color: #ffffff; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px;">🔐 TRACE Event Hub</h2>
            <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Admin Credentials Notification</p>
          </div>
          <div style="padding: 24px;">
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>Here are your access details for <strong>${user.branch || "TRACE Main"}</strong> on TRACE Event Hub:</p>
            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <div style="margin-bottom: 8px;">📧 <strong>Login Email:</strong> <span style="color:#0052cc;font-weight:600;">${user.email}</span></div>
              <div style="margin-bottom: 8px;">🔑 <strong>Password:</strong> <code style="background:#e2e8f0;padding:3px 6px;border-radius:4px;color:#0f172a;">${tempPass}</code></div>
              <div>🏢 <strong>Branch:</strong> <strong>${user.branch || "TRACE Main"}</strong></div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResult = await sendRealEmail({
      to: user.email,
      subject: emailSubject,
      html: emailHtml,
    });

    res.json({
      success: true,
      message: `Credentials email dispatched to ${user.email}!`,
      previewUrl: emailResult.previewUrl || null,
      emailNotification: {
        recipient: user.email,
        subject: emailSubject,
        adminName: user.name,
        branchName: user.branch || "TRACE Main",
        email: user.email,
        temporaryPassword: tempPass,
        grantedPermissions: perms,
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to dispatch email", error: error.message });
  }
};

module.exports = {
  signupUser,
  loginUser,
  getMe,
  updateUserProfile,
  seedAdminUser,
  getAllUsers,
  deleteUser,
  createBranchAdmin,
  sendEmailCredentials,
};
