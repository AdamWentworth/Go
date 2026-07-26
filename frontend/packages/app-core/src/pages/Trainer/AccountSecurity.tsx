import { useEffect, useState } from "react";
import {
  FaEnvelope,
  FaKey,
  FaSignOutAlt,
  FaTrash,
  FaUser,
} from "react-icons/fa";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

import { useAuth } from "@/contexts/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { useAuthStore } from "@/stores/useAuthStore";

import TrainerPageShell from "./TrainerPageShell";

const AccountSecurity = () => {
  const navigate = useNavigate();
  const { confirm } = useModal();
  const { updateUserDetails, logout, deleteAccount } = useAuth();
  const user = useAuthStore((state) => state.user);
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [navigate, user]);

  if (!user) return null;

  const saveAccount = async () => {
    if (password && password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setSaving(true);
    const result = await updateUserDetails(user.user_id, {
      username: username.trim(),
      email: email.trim(),
      ...(password ? { password } : {}),
    });
    setSaving(false);
    if (!result.success) {
      toast.error(
        typeof result.error === "string"
          ? result.error
          : "Could not update account.",
      );
      return;
    }
    setPassword("");
    setConfirmPassword("");
    toast.success("Account updated");
  };

  const signOut = async () => {
    await logout();
    navigate("/login");
  };

  const removeAccount = async () => {
    const approved = await confirm(
      "Delete your sign-in account? This cannot be undone.",
    );
    if (!approved) return;
    try {
      await deleteAccount(user.user_id);
      toast.success("Account deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete account.",
      );
    }
  };

  return (
    <TrainerPageShell eyebrow="Settings" title="Account & security">
      <section className="trainer-section">
        <header>
          <div>
            <span>Login identity</span>
            <h2>Account details</h2>
          </div>
          <FaKey />
        </header>
        <div className="trainer-form-grid">
          <label className="trainer-field">
            <span>
              <FaUser /> Username
            </span>
            <input
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <label className="trainer-field">
            <span>
              <FaEnvelope /> Email
            </span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="trainer-field">
            <span>New password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              placeholder="Leave blank to keep current password"
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label className="trainer-field">
            <span>Confirm new password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
        </div>
        <div className="trainer-form-actions">
          <button
            type="button"
            className="trainer-button trainer-button-primary"
            disabled={saving}
            onClick={() => void saveAccount()}
          >
            <FaKey />
            {saving ? "Saving..." : "Update account"}
          </button>
        </div>
      </section>

      <section className="trainer-section">
        <header>
          <div>
            <span>Session</span>
            <h2>Sign out</h2>
          </div>
          <FaSignOutAlt />
        </header>
        <p className="trainer-section-copy">
          End this session and clear locally stored account data from this
          device.
        </p>
        <button
          type="button"
          className="trainer-button trainer-button-secondary"
          onClick={() => void signOut()}
        >
          <FaSignOutAlt />
          Sign out
        </button>
      </section>

      <section className="trainer-section trainer-danger-section">
        <header>
          <div>
            <span>Permanent action</span>
            <h2>Delete account</h2>
          </div>
          <FaTrash />
        </header>
        <p className="trainer-section-copy">
          Permanently remove your sign-in account and end access to it.
        </p>
        <button
          type="button"
          className="trainer-button trainer-button-danger"
          onClick={() => void removeAccount()}
        >
          <FaTrash />
          Delete account
        </button>
      </section>
    </TrainerPageShell>
  );
};

export default AccountSecurity;
