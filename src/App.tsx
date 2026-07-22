import { useState, useEffect } from "react";
import { Plus, LogOut, Search, User, Shield, CheckCircle2, XCircle, AlertCircle, Users, Pencil, Trash2, Building2, Lock, Eye, EyeOff,  Database, Bell, ChevronsLeft, ChevronsRight } from "lucide-react";
import alamtriGeoLogo from "./imports/alamtrigeo.png";
import alamtriGeoLogin from "./imports/alamtrigeo-1.png";

import { Button } from "alamtri-geo-design-system";
import { Field, TextInput } from "alamtri-geo-design-system";
import { Badge } from "alamtri-geo-design-system";
import { Alert, ConfirmDialog } from "alamtri-geo-design-system";
import { Modal } from "alamtri-geo-design-system";
import { COLOR, FONT, RADIUS, SHADOW } from "alamtri-geo-design-system";



// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Page = "login" | "otp" | "dashboard" | "customers" | "cek" | "hasil" | "change-password";

interface Account {
  id: number;
  email: string;
  password: string;
  nama: string;
  group: "Administrator" | "Checker";
}

interface UserRecord {
  id: number;
  username: string;
  nama: string;
  email: string;
  perusahaan: string;
  group: "Administrator" | "Checker";
  status: "aktif" | "nonaktif";
}

type UserFormState = Omit<UserRecord, "id">;

interface Customer {
  code: string;
  nik: string;
  nama: string;
  tglLahir: string;
  jenisKelamin: string;
  alamat: string;
  noHp: string;
  status: string;
}

type AlertType = "match" | "nama_match_id_mismatch" | "id_match_nama_mismatch" | "hr_needed" | "not_found" | null;

interface CekResult {
  nik: string;
  nama: string;
  alertType: AlertType;
  customer: Customer | null;
}

// ---------------------------------------------------------------------------
// Shared TopBar
// ---------------------------------------------------------------------------

function TopBar({ onLogout, group, nama }: { onLogout?: () => void; group?: Account["group"]; nama?: string }) {
  const initials = nama
    ? nama.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "?";

  return (
    <div
      style={{
        ...FONT,
        height: 56,
        backgroundColor: "#fff",
        color: COLOR.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        borderBottom: `1px solid ${COLOR.border}`,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <img src={alamtriGeoLogo} alt="AlamTri geo" style={{ height: 36, width: "auto", objectFit: "contain" }} />

      {/* Right: bell + user */}
      {onLogout && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Bell */}
          <button
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: `1px solid ${COLOR.border}`,
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: COLOR.textMuted,
            }}
          >
            <Bell size={16} />
          </button>

          {/* Avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#E07B39",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 13,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ lineHeight: 1.25 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>{nama || "—"}</div>
              <div style={{ fontSize: 11, color: COLOR.textMuted }}>{group}</div>
            </div>
            {/* Logout chevron */}
            <button
              onClick={onLogout}
              title="Keluar"
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: COLOR.textMuted,
                display: "flex",
                alignItems: "center",
                padding: 4,
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar + AppLayout (shared authenticated shell)
// ---------------------------------------------------------------------------

interface NavItem {
  icon: React.ReactNode;
  label: string;
  page: Page | null;
  action: () => void;
  active: boolean;
  adminOnly?: boolean;
}

function Sidebar({
  currentPage,
  onNavigate,
  group,
  collapsed,
  onToggle,
}: {
  currentPage: Page;
  onNavigate: (p: Page) => void;
  group: Account["group"];
  collapsed: boolean;
  onToggle: () => void;
}) {
  const isAdmin = group === "Administrator";

  const items: NavItem[] = [
    ...(isAdmin
      ? [{
        icon: <Users size={17} />,
        label: "Manajemen User",
        page: "dashboard" as Page,
        action: () => onNavigate("dashboard"),
        active: currentPage === "dashboard",
        adminOnly: true,
      }]
      : []),
    {
      icon: <Search size={17} />,
      label: "Cek Data Customer",
      page: "cek" as Page,
      action: () => onNavigate("cek"),
      active: currentPage === "cek" || currentPage === "hasil",
    },
    ...(isAdmin
      ? [{
        icon: <Database size={17} />,
        label: "Data Customer",
        page: "customers" as Page,
        action: () => onNavigate("customers"),
        active: currentPage === "customers",
        adminOnly: true,
      }]
      : []),
    {
      icon: <Lock size={17} />,
      label: "Ubah Password",
      page: "change-password" as Page,
      action: () => onNavigate("change-password"),
      active: currentPage === "change-password",
    },
  ];

  const W = collapsed ? 56 : 228;

  return (
    <div
      style={{
        width: W,
        flexShrink: 0,
        backgroundColor: COLOR.surface,
        borderRight: `1px solid ${COLOR.border}`,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.22s cubic-bezier(.4,0,.2,1)",
        overflow: "hidden",
        position: "sticky",
        top: 56,
        height: "calc(100vh - 56px)",
      }}
    >
      {/* Header row: NAVIGATION label + toggle */}
      <div
        style={{
          height: 48,
          padding: collapsed ? "0 12px" : "0 14px 0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          borderBottom: `1px solid ${COLOR.borderSoft}`,
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <span style={{ fontSize: 10.5, fontWeight: 700, color: COLOR.textSubtle, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Navigation
          </span>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? "Perluas menu" : "Kecilkan menu"}
          style={{
            ...FONT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "transparent",
            color: COLOR.textMuted,
            cursor: "pointer",
            padding: 4,
            borderRadius: RADIUS.sm,
            flexShrink: 0,
          }}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: collapsed ? "0 6px" : "0 8px" }}>
        {items.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            title={collapsed ? item.label : undefined}
            style={{
              ...FONT,
              display: "flex",
              alignItems: "center",
              gap: collapsed ? 0 : 10,
              justifyContent: collapsed ? "center" : "flex-start",
              width: "100%",
              height: 40,
              padding: collapsed ? "0" : "0 10px",
              borderRadius: RADIUS.md,
              border: "none",
              backgroundColor: item.active ? `rgba(1,59,82,0.08)` : "transparent",
              color: item.active ? COLOR.main : COLOR.textMuted,
              fontSize: 13,
              fontWeight: item.active ? 700 : 500,
              cursor: "pointer",
              transition: "background-color 0.15s, color 0.15s",
              boxShadow: item.active ? `inset 3px 0 0 ${COLOR.main}` : "none",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { if (!item.active) e.currentTarget.style.backgroundColor = COLOR.hover; }}
            onMouseLeave={(e) => { if (!item.active) e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <span style={{ flexShrink: 0, display: "flex" }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom group badge */}
      {!collapsed && (
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${COLOR.borderSoft}` }}>
          <div style={{ fontSize: 11, color: COLOR.textSubtle, marginBottom: 4 }}>Login sebagai</div>
          <span
            style={{
              ...FONT,
              fontSize: 11.5,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: RADIUS.pill,
              backgroundColor: isAdmin ? "rgba(1,59,82,0.08)" : COLOR.infoBg,
              color: isAdmin ? COLOR.main : COLOR.blue,
              border: `1px solid ${isAdmin ? COLOR.border : "rgba(0,92,150,0.2)"}`,
            }}
          >
            {group}
          </span>
        </div>
      )}
    </div>
  );
}

function AppLayout({
  children,
  onLogout,
  group,
  nama,
  currentPage,
  onNavigate,
  sidebarCollapsed,
  onToggleSidebar,
}: {
  children: React.ReactNode;
  onLogout: () => void;
  group: Account["group"];
  nama: string;
  currentPage: Page;
  onNavigate: (p: Page) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: COLOR.bg }}>
      <TopBar onLogout={onLogout} group={group} nama={nama} />
      <div style={{ display: "flex", flex: 1, alignItems: "flex-start" }}>
        <Sidebar
          currentPage={currentPage}
          onNavigate={onNavigate}
          group={group}
          collapsed={sidebarCollapsed}
          onToggle={onToggleSidebar}
        />
        <main style={{ flex: 1, minWidth: 0, minHeight: "calc(100vh - 56px)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page 1 — Login
// ---------------------------------------------------------------------------

function LoginPage({ onLogin }: { onLogin: (email: string, group: Account["group"], nama: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError("Email dan password wajib diisi."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login gagal.');
        setLoading(false);
        return;
      }
      setError(null);
      onLogin(data.email, data.group as Account["group"], data.nama);
    } catch (err) {
      setError('Koneksi ke server gagal.');
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(150deg, ${COLOR.main} 0%, #025f7a 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          ...FONT,
          backgroundColor: COLOR.surface,
          borderRadius: RADIUS.xl,
          boxShadow: SHADOW.lg,
          width: "100%",
          maxWidth: 420,
          padding: 36,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <img src={alamtriGeoLogin} alt="AlamTri geo" style={{ height: 48, width: "auto", objectFit: "contain", marginBottom: 16 }} />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: COLOR.text, margin: 0, letterSpacing: "-0.02em" }}>
            Vendor Governance Portal
          </h1>
          <p style={{ fontSize: 13, color: COLOR.textMuted, margin: "4px 0 0", textAlign: "center" }}>
            Masuk ke akun Anda untuk melanjutkan
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: 16 }}>
            <Alert tone="error" title={error} onClose={() => setError(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Email" required htmlFor="email">
            <TextInput
              id="email"
              type="email"
              placeholder="nama@perusahaan.co.id"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              iconLeft={<User size={15} />}
            />
          </Field>

          <Field label="Password" required htmlFor="password">
            <TextInput
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              iconLeft={<Lock size={15} />}
              iconRight={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0, color: "inherit" }}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />
          </Field>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            {/* using <button> instead of <Button variant="link">: need precise right-aligned inline link placement without wrapping in a flex row */}
            <button
              type="button"
              style={{
                ...FONT,
                fontSize: 12.5,
                color: COLOR.ocean,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                padding: 0,
              }}
            >
              {/* Lupa Password? */}
            </button>
          </div>

          <Button variant="primary" size="lg" fullWidth disabled={loading}>
            {loading ? "Memproses..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page 2 — OTP Verification
// ---------------------------------------------------------------------------

function OtpPage({
  onVerify,
  email,
}: {
  onVerify: (group: Account["group"]) => void;
  email: string;
}) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDigit(idx: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    if (val && idx < 5) {
      (document.getElementById(`otp-${idx + 1}`) as HTMLInputElement)?.focus();
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      (document.getElementById(`otp-${idx - 1}`) as HTMLInputElement)?.focus();
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < 6) { setError("Lengkapi semua 6 digit kode OTP."); return; }
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode: code })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Verifikasi OTP gagal.');
        return;
      }
      setError(null);
      onVerify(data.group as Account["group"]);
    } catch (err) {
      setError('Koneksi ke server gagal.');
    }
  }

  function handleResend() {
    setResent(true);
    setDigits(["", "", "", "", "", ""]);
    setError(null);
    setTimeout(() => setResent(false), 4000);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(150deg, ${COLOR.main} 0%, #025f7a 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          ...FONT,
          backgroundColor: COLOR.surface,
          borderRadius: RADIUS.xl,
          boxShadow: SHADOW.lg,
          width: "100%",
          maxWidth: 420,
          padding: 36,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: RADIUS.lg,
              backgroundColor: COLOR.infoBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Shield size={26} color={COLOR.blue} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: COLOR.text, margin: 0, letterSpacing: "-0.02em" }}>
            Verifikasi OTP
          </h1>
          <p style={{ fontSize: 13, color: COLOR.textMuted, margin: "6px 0 0", textAlign: "center", lineHeight: 1.5 }}>
            Kode verifikasi 6 digit telah dikirim ke{" "}
            <strong style={{ color: COLOR.text }}>{email}</strong>
          </p>
        </div>

        {resent && (
          <div style={{ marginBottom: 16 }}>
            <Alert tone="success" title={`Kode OTP baru telah dikirim ke ${email}.`} />
          </div>
        )}
        {error && (
          <div style={{ marginBottom: 16 }}>
            <Alert tone="error" title={error} onClose={() => setError(null)} />
          </div>
        )}

        <form onSubmit={handleVerify}>
          {/* 6-digit OTP inputs — using raw <input> instead of a kit component: kit has no OTP-specific digit input */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
            {digits.map((d, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                style={{
                  ...FONT,
                  width: 48,
                  height: 52,
                  textAlign: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  color: COLOR.text,
                  border: `2px solid ${d ? COLOR.ocean : COLOR.border}`,
                  borderRadius: RADIUS.md,
                  outline: "none",
                  backgroundColor: COLOR.surface,
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => { e.target.style.borderColor = COLOR.ocean; e.target.style.boxShadow = "0 0 0 3px rgba(15,130,138,0.18)"; }}
                onBlur={(e) => { e.target.style.borderColor = d ? COLOR.ocean : COLOR.border; e.target.style.boxShadow = "none"; }}
              />
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Button variant="primary" size="lg" fullWidth>
              Verifikasi
            </Button>
            <Button variant="secondary" size="md" fullWidth onClick={handleResend} type="button">
              Kirim Ulang OTP
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page 3 — Dashboard / Master User
// ---------------------------------------------------------------------------

const EMPTY_FORM: UserFormState = { username: "", nama: "", email: "", perusahaan: "", group: "Checker", status: "aktif" };

function UserFormFields({
  form,
  onChange,
  error,
  onCloseError,
  idPrefix,
}: {
  form: UserFormState;
  onChange: (f: UserFormState) => void;
  error: boolean;
  onCloseError: () => void;
  idPrefix: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && (
        <Alert tone="error" title="Username, Nama, Email, dan Perusahaan wajib diisi." onClose={onCloseError} />
      )}
      <Field label="Username" required htmlFor={`${idPrefix}-username`}>
        <TextInput
          id={`${idPrefix}-username`}
          placeholder="username.user"
          value={form.username}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...form, username: e.target.value })}
        />
      </Field>
      <Field label="Nama Lengkap" required htmlFor={`${idPrefix}-nama`}>
        <TextInput
          id={`${idPrefix}-nama`}
          placeholder="Nama Lengkap"
          value={form.nama}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...form, nama: e.target.value })}
        />
      </Field>
      <Field label="Email" required htmlFor={`${idPrefix}-email`}>
        <TextInput
          id={`${idPrefix}-email`}
          type="email"
          placeholder="email@perusahaan.co.id"
          value={form.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...form, email: e.target.value })}
        />
      </Field>
      <Field label="Nama Perusahaan" required htmlFor={`${idPrefix}-perusahaan`}>
        <TextInput
          id={`${idPrefix}-perusahaan`}
          placeholder="PT Nama Perusahaan"
          value={form.perusahaan}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...form, perusahaan: e.target.value })}
          iconLeft={<Building2 size={15} />}
        />
      </Field>
      <Field label="Group" htmlFor={`${idPrefix}-group`}>
        {/* using <button> toggles instead of kit Select: need inline 2-option segment for group */}
        <div style={{ display: "flex", gap: 8 }}>
          {(["Administrator", "Checker"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onChange({ ...form, group: g })}
              style={{
                ...FONT,
                flex: 1,
                height: 38,
                borderRadius: RADIUS.md,
                border: `1px solid ${form.group === g ? COLOR.main : COLOR.border}`,
                backgroundColor: form.group === g ? COLOR.main : COLOR.surface,
                color: form.group === g ? "#fff" : COLOR.textMuted,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Status" htmlFor={`${idPrefix}-status`}>
        {/* using <button> toggles instead of kit Select: need inline 2-option segment for status */}
        <div style={{ display: "flex", gap: 8 }}>
          {(["aktif", "nonaktif"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ ...form, status: s })}
              style={{
                ...FONT,
                flex: 1,
                height: 38,
                borderRadius: RADIUS.md,
                border: `1px solid ${form.status === s ? COLOR.main : COLOR.border}`,
                backgroundColor: form.status === s ? COLOR.main : COLOR.surface,
                color: form.status === s ? "#fff" : COLOR.textMuted,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {s === "aktif" ? "Aktif" : "Non-aktif"}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function DashboardPage({ triggerAddUser, onTriggerHandled }: { group: Account["group"]; triggerAddUser?: boolean; onTriggerHandled?: () => void }) {
  const [users, setUsers] = useState<UserRecord[]>([]);

  // Fetch users from API
  async function fetchUsers() {
    try {
      const res = await fetch('/api/user');
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  // Add modal
  const [showAdd, setShowAdd] = useState(false);

  // Auto-open add modal when triggered from sidebar
  useEffect(() => {
    if (triggerAddUser) {
      setShowAdd(true);
      onTriggerHandled?.();
    }
  }, [triggerAddUser]);
  const [addForm, setAddForm] = useState<UserFormState>({ ...EMPTY_FORM });
  const [addError, setAddError] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<UserRecord | null>(null);
  const [editForm, setEditForm] = useState<UserFormState>({ ...EMPTY_FORM });
  const [editError, setEditError] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);

  // Reset password confirm
  const [resetConfirmTarget, setResetConfirmTarget] = useState<UserRecord | null>(null);

  function openEdit(user: UserRecord) {
    setEditTarget(user);
    setEditForm({ username: user.username, nama: user.nama, email: user.email, perusahaan: user.perusahaan, group: user.group, status: user.status });
    setEditError(false);
  }

  async function handleAdd() {
    if (!addForm.username || !addForm.nama || !addForm.email || !addForm.perusahaan) { setAddError(true); return; }
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm)
      });
      if (res.ok) {
        fetchUsers();
        setAddForm({ ...EMPTY_FORM });
        setAddError(false);
        setShowAdd(false);
      } else {
        const data = await res.json();
        alert(data.message || 'Gagal menambahkan user');
      }
    } catch (err) {
      alert('Koneksi ke server gagal.');
    }
  }

  async function handleEdit() {
    if (!editForm.username || !editForm.nama || !editForm.email || !editForm.perusahaan) { setEditError(true); return; }
    try {
      const res = await fetch(`/api/user/${editTarget!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        fetchUsers();
        setEditTarget(null);
        setEditError(false);
      } else {
        const data = await res.json();
        alert(data.message || 'Gagal mengubah user');
      }
    } catch (err) {
      alert('Koneksi ke server gagal.');
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/user/${deleteTarget!.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchUsers();
        setDeleteTarget(null);
      } else {
        const data = await res.json();
        alert(data.message || 'Gagal menghapus user');
      }
    } catch (err) {
      alert('Koneksi ke server gagal.');
    }
  }

  async function handleResetPassword() {
    if (!resetConfirmTarget) return;
    try {
      const res = await fetch(`/api/user/${resetConfirmTarget.id}/reset`, {
        method: 'POST'
      });
      if (res.ok) {
        alert(`Password untuk user "${resetConfirmTarget.nama}" telah di-reset menjadi "semangatpagi!!!"`);
      } else {
        const data = await res.json();
        alert(data.message || 'Gagal me-reset password');
      }
    } catch (err) {
      alert('Koneksi ke server gagal.');
    } finally {
      setResetConfirmTarget(null);
    }
  }

  // Table columns — action buttons rendered manually outside Table since kit Table doesn't support arbitrary cell renders with closures
  return (
    <>
      <div style={{ ...FONT, maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
        {/* Heading */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Users size={18} color={COLOR.main} />
              <h2 style={{ fontSize: 20, fontWeight: 800, color: COLOR.text, margin: 0, letterSpacing: "-0.02em" }}>
                Manajemen User
              </h2>
            </div>
            <p style={{ fontSize: 13, color: COLOR.textMuted, margin: 0 }}>
              Kelola akun pengguna sistem verifikasi data customer.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="primary" size="md" onClick={() => { setAddForm({ ...EMPTY_FORM }); setShowAdd(true); }} iconLeft={<Plus size={14} />}>
              Tambah User
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total User", value: users.length },
            { label: "User Aktif", value: users.filter((u) => u.status === "aktif").length },
            { label: "User Non-aktif", value: users.filter((u) => u.status === "nonaktif").length },
          ].map((m) => (
            <div key={m.label} style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: RADIUS.lg, padding: "16px 20px" }}>
              <div style={{ fontSize: 12, color: COLOR.textMuted, fontWeight: 500 }}>{m.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: COLOR.text, marginTop: 4 }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Custom table with CRUD action column */}
        <div style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: RADIUS.lg, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, ...FONT }}>
              <thead>
                <tr style={{ backgroundColor: COLOR.bg }}>
                  {["USERNAME", "NAMA LENGKAP", "EMAIL", "NAMA PERUSAHAAN", "GROUP", "STATUS", "AKSI"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        fontSize: 11.5,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        color: COLOR.textMuted,
                        borderBottom: `1px solid ${COLOR.borderSoft}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    style={{ transition: "background-color 0.1s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLOR.hover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}`, fontWeight: 600, color: COLOR.main }}>{u.username}</td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}`, color: COLOR.text }}>{u.nama}</td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}`, color: COLOR.textMuted }}>{u.email}</td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}`, color: COLOR.text }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Building2 size={13} color={COLOR.textSubtle} />
                        {u.perusahaan}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}` }}>
                      <Badge tone={u.group === "Administrator" ? "brand" : "info"} dot>
                        {u.group}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}` }}>
                      <Badge tone={u.status === "aktif" ? "success" : "neutral"} dot>
                        {u.status === "aktif" ? "Aktif" : "Non-aktif"}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}` }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          title="Edit user"
                          onClick={() => openEdit(u)}
                          style={{
                            ...FONT,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            height: 30,
                            padding: "0 10px",
                            borderRadius: RADIUS.md,
                            border: `1px solid ${COLOR.border}`,
                            backgroundColor: COLOR.surface,
                            color: COLOR.main,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLOR.hover; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = COLOR.surface; }}
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                        <button
                          title="Hapus user"
                          onClick={() => setDeleteTarget(u)}
                          style={{
                            ...FONT,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            height: 30,
                            padding: "0 10px",
                            borderRadius: RADIUS.md,
                            border: `1px solid ${COLOR.dangerBg}`,
                            backgroundColor: COLOR.dangerBg,
                            color: COLOR.danger,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(197,52,26,0.15)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = COLOR.dangerBg; }}
                        >
                          <Trash2 size={12} />
                          Hapus
                        </button>
                        <button
                          title="Reset password"
                          onClick={() => setResetConfirmTarget(u)}
                          style={{
                            ...FONT,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            height: 30,
                            padding: "0 10px",
                            borderRadius: RADIUS.md,
                            border: `1px solid ${COLOR.warningBg}`,
                            backgroundColor: COLOR.warningBg,
                            color: "#9C6B00",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(156,107,0,0.15)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = COLOR.warningBg; }}
                        >
                          <Lock size={12} />
                          Reset
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: "40px 24px", textAlign: "center", color: COLOR.textMuted, fontSize: 13 }}>
                      Belum ada data user. Klik "Tambah User" untuk menambahkan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); setAddError(false); }}
        title="Tambah User Baru"
        description="Isi informasi pengguna baru di bawah ini."
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setShowAdd(false)}>Batal</Button>
            <Button variant="primary" size="md" onClick={handleAdd}>Simpan User</Button>
          </>
        }
      >
        <UserFormFields form={addForm} onChange={setAddForm} error={addError} onCloseError={() => setAddError(false)} idPrefix="add" />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editTarget}
        onClose={() => { setEditTarget(null); setEditError(false); }}
        title="Edit User"
        description={`Perbarui informasi untuk ${editTarget?.nama ?? ""}`}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setEditTarget(null)}>Batal</Button>
            <Button variant="primary" size="md" onClick={handleEdit}>Simpan Perubahan</Button>
          </>
        }
      >
        <UserFormFields form={editForm} onChange={setEditForm} error={editError} onCloseError={() => setEditError(false)} idPrefix="edit" />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus User"
        description={`Apakah Anda yakin ingin menghapus user "${deleteTarget?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        destructive
      />

      {/* Reset Password Confirm */}
      <ConfirmDialog
        open={!!resetConfirmTarget}
        onClose={() => setResetConfirmTarget(null)}
        onConfirm={handleResetPassword}
        title="Reset Password User"
        description={`Apakah Anda yakin ingin me-reset password untuk user "${resetConfirmTarget?.nama}"? Password akan di-ubah menjadi "semangatpagi!!!".`}
        confirmLabel="Ya, Reset"
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Page 4 — Cek Data (NIK & Nama search)
// ---------------------------------------------------------------------------

function CekPage({ onHasil }: { onHasil: (r: CekResult) => void }) {
  const [code, setCode] = useState("");
  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [errors, setErrors] = useState<{ code?: string; nama?: string; nik?: string }>({});
  const [showPopup, setShowPopup] = useState(false);
  const [pendingResult, setPendingResult] = useState<CekResult | null>(null);

  const alertConfig: Record<
    NonNullable<AlertType>,
    { tone: "success" | "error" | "warning" | "info"; title: string; description: string; icon: React.ReactNode }
  > = {
    match: {
      tone: "success",
      title: "Data Match",
      description: "Code, Nama Lengkap, dan NIK cocok dengan data master customer.",
      icon: <CheckCircle2 size={44} color={COLOR.forest} />,
    },
    nama_match_id_mismatch: {
      tone: "warning",
      title: "Nama Match, ID Tidak Match",
      description: "Nama ditemukan namun NIK (ID Number) yang dimasukkan tidak sesuai dengan data master.",
      icon: <AlertCircle size={44} color="#9C6B00" />,
    },
    id_match_nama_mismatch: {
      tone: "warning",
      title: "ID Match, Nama Tidak Match",
      description: "NIK ditemukan namun nama yang dimasukkan tidak sesuai dengan data master.",
      icon: <AlertCircle size={44} color="#9C6B00" />,
    },
    hr_needed: {
      tone: "info",
      title: "Hubungi Bagian HR",
      description: "Nama ditemukan namun NIK tidak ada di data master. Silakan hubungi bagian HR.",
      icon: <AlertCircle size={44} color={COLOR.blue} />,
    },
    not_found: {
      tone: "error",
      title: "Data Tidak Ditemukan",
      description: "Data tidak ditemukan dalam data master customer.",
      icon: <XCircle size={44} color={COLOR.danger} />,
    },
  };

  function validate(): boolean {
    const e: typeof errors = {};
    if (!code.trim()) e.code = "Code wajib diisi";
    if (!nama.trim()) e.nama = "Nama Lengkap wajib diisi";
    if (!nik.trim()) e.nik = "NIK (ID Number) wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCek(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      const res = await fetch('/api/customer/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), nama: nama.trim(), nik: nik.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setPendingResult(data);
        setShowPopup(true);
      } else {
        alert(data.message || 'Gagal melakukan verifikasi');
      }
    } catch (err) {
      alert('Koneksi ke server gagal.');
    }
  }

  function handleConfirm() {
    if (pendingResult) onHasil(pendingResult);
    setShowPopup(false);
  }

  return (
    <>
      <div style={{ ...FONT, maxWidth: 680, margin: "0 auto", padding: "36px 24px" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Search size={18} color={COLOR.main} />
            <h2 style={{ fontSize: 20, fontWeight: 800, color: COLOR.text, margin: 0, letterSpacing: "-0.02em" }}>
              Pengecekan Data Customer
            </h2>
          </div>
          <p style={{ fontSize: 13, color: COLOR.textMuted, margin: 0 }}>
            Masukkan Code, Nama Lengkap, dan NIK untuk memvalidasi data customer di sistem.
          </p>
        </div>

        <div
          style={{
            backgroundColor: COLOR.surface,
            border: `1px solid ${COLOR.border}`,
            borderRadius: RADIUS.lg,
            padding: 28,
            boxShadow: SHADOW.sm,
          }}
        >
          <form onSubmit={handleCek} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Field
              label="Code"
              required
              htmlFor="cek-code"
              status={errors.code ? "error" : "default"}
              helper={errors.code}
            >
              <TextInput
                id="cek-code"
                placeholder="Contoh: 1 atau 2"
                value={code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setCode(e.target.value); setErrors((p) => ({ ...p, code: undefined })); }}
                status={errors.code ? "error" : "default"}
                iconLeft={<Shield size={15} />}
              />
            </Field>

            <Field
              label="Nama Lengkap (Individu Name)"
              required
              htmlFor="cek-nama"
              status={errors.nama ? "error" : "default"}
              helper={errors.nama}
            >
              <TextInput
                id="cek-nama"
                placeholder="Contoh: TON OMO"
                value={nama}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setNama(e.target.value); setErrors((p) => ({ ...p, nama: undefined })); }}
                status={errors.nama ? "error" : "default"}
                iconLeft={<User size={15} />}
              />
            </Field>

            <Field
              label="NIK (ID Number)"
              required
              htmlFor="cek-nik"
              status={errors.nik ? "error" : "default"}
              helper={errors.nik}
            >
              <TextInput
                id="cek-nik"
                placeholder="Contoh: 095770290"
                value={nik}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setNik(e.target.value); setErrors((p) => ({ ...p, nik: undefined })); }}
                status={errors.nik ? "error" : "default"}
                iconLeft={<Shield size={15} />}
              />
            </Field>

            <div style={{ paddingTop: 4 }}>
              <Button variant="primary" size="lg" fullWidth iconLeft={<Search size={15} />}>
                Cek Validasi
              </Button>
            </div>
          </form>
        </div>

        <div
          style={{
            marginTop: 14,
            padding: "12px 16px",
            backgroundColor: COLOR.infoBg,
            borderRadius: RADIUS.md,
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <AlertCircle size={15} color={COLOR.blue} style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 12.5, color: COLOR.blue, margin: 0, lineHeight: 1.5 }}>
            Ketiga field wajib diisi. Pastikan data sesuai dengan yang tercatat di data master customer.
          </p>
        </div>
      </div>

      {/* Validation result popup */}
      {showPopup && pendingResult?.alertType && (
        <div
          onClick={() => setShowPopup(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(1,59,82,0.45)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              ...FONT,
              backgroundColor: COLOR.surface,
              borderRadius: RADIUS.lg,
              width: "100%",
              maxWidth: 440,
              padding: 32,
              boxShadow: "0 24px 64px rgba(1,59,82,0.3)",
              textAlign: "center",
            }}
          >
            <div style={{ marginBottom: 14 }}>
              {alertConfig[pendingResult.alertType].icon}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: COLOR.text, margin: "0 0 8px", letterSpacing: "-0.01em" }}>
              {alertConfig[pendingResult.alertType].title}
            </h3>
            <p style={{ fontSize: 13.5, color: COLOR.textMuted, margin: "0 0 24px", lineHeight: 1.55 }}>
              {alertConfig[pendingResult.alertType].description}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="secondary" size="md" fullWidth onClick={() => setShowPopup(false)}>
                Tutup
              </Button>
              {pendingResult.alertType !== "not_found" && (
                <Button variant="primary" size="md" fullWidth onClick={handleConfirm}>
                  Lihat Detail
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Page 5 — Hasil Pengecekan
// ---------------------------------------------------------------------------

function HasilPage({ result, onBack }: { result: CekResult; onBack: () => void }) {
  const { alertType, customer, nik, nama } = result;

  const statusConfig: Record<
    NonNullable<AlertType>,
    { tone: "success" | "neutral" | "info" | "brand"; label: string }
  > = {
    match: { tone: "success", label: "Data Valid — Terdaftar" },
    nama_match_id_mismatch: { tone: "neutral", label: "Nama Match, ID Tidak Match" },
    id_match_nama_mismatch: { tone: "neutral", label: "ID Match, Nama Tidak Match" },
    hr_needed: { tone: "info", label: "Hubungi Bagian HR" },
    not_found: { tone: "neutral", label: "Data Tidak Ditemukan" },
  };

  const statusDescription: Record<NonNullable<AlertType>, string> = {
    match: "NIK dan Nama cocok dengan data master customer.",
    not_found: "Data tidak ditemukan dalam sistem.",
    nama_match_id_mismatch: "Nama ditemukan namun NIK yang dimasukkan tidak sesuai dengan data master.",
    id_match_nama_mismatch: "NIK ditemukan namun nama yang dimasukkan tidak sesuai dengan data master.",
    hr_needed: "Nama customer ditemukan namun NIK tidak terdaftar. Segera hubungi bagian HR.",
  };

  const cfg = alertType ? statusConfig[alertType] : null;

  return (
    <>
      <div style={{ ...FONT, maxWidth: 720, margin: "0 auto", padding: "36px 24px" }}>
        {/* Back link */}
        {/* using <button> instead of <Button variant="link">: navigational back link needs left-aligned icon+text layout without full-width styling */}
        <button
          onClick={onBack}
          style={{
            ...FONT,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: COLOR.ocean,
            fontSize: 13,
            fontWeight: 600,
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 20,
          }}
        >
          ← Kembali ke Pencarian
        </button>

        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: COLOR.text, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            Hasil Pengecekan Data
          </h2>
          <p style={{ fontSize: 13, color: COLOR.textMuted, margin: 0 }}>
            NIK: <strong>{nik}</strong>
            {nama ? <> · Nama: <strong>{nama.toUpperCase()}</strong></> : null}
          </p>
        </div>

        {/* Status */}
        {cfg && (
          <div
            style={{
              backgroundColor: COLOR.surface,
              border: `1px solid ${COLOR.border}`,
              borderRadius: RADIUS.lg,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 20,
              boxShadow: SHADOW.sm,
              flexWrap: "wrap",
            }}
          >
            <Badge tone={cfg.tone} dot>{cfg.label}</Badge>
            <span style={{ fontSize: 13, color: COLOR.textMuted }}>
              {alertType ? statusDescription[alertType] : ""}
            </span>
          </div>
        )}

        {/* Customer detail */}
        {customer ? (
          <div
            style={{
              backgroundColor: COLOR.surface,
              border: `1px solid ${COLOR.border}`,
              borderRadius: RADIUS.lg,
              overflow: "hidden",
              boxShadow: SHADOW.sm,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                padding: "14px 20px",
                borderBottom: `1px solid ${COLOR.borderSoft}`,
                backgroundColor: COLOR.bg,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 13.5, fontWeight: 700, color: COLOR.text }}>Ringkasan Data Customer</span>
              <Badge tone="success" dot>Terdaftar</Badge>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <dl style={{ display: "grid", gridTemplateColumns: "180px 1fr", rowGap: 14, columnGap: 16 }}>
                {[
                  { label: "Code", value: customer.code },
                  { label: "Nama Lengkap (Individu Name)", value: customer.nama },
                  { label: "NIK (ID Number)", value: customer.nik },
                  { label: "Tanggal Lahir", value: customer.tglLahir },
                  { label: "Jenis Kelamin", value: customer.jenisKelamin },
                  { label: "Alamat", value: customer.alamat },
                  { label: "No. HP", value: customer.noHp },
                  {
                    label: "Status Customer",
                    value: (
                      <Badge tone="success" dot>
                        {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                      </Badge>
                    ),
                  },
                ].map((item) => (
                  <div key={item.label} style={{ display: "contents" }}>
                    <dt style={{ fontSize: 13, color: COLOR.textMuted, fontWeight: 500 }}>{item.label}</dt>
                    <dd style={{ fontSize: 13, color: COLOR.text, fontWeight: 600, margin: 0 }}>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: COLOR.surface,
              border: `1px dashed ${COLOR.border}`,
              borderRadius: RADIUS.lg,
              padding: "40px 24px",
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            <XCircle size={36} color={COLOR.textSubtle} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: COLOR.text }}>Data tidak ditemukan</div>
            <div style={{ fontSize: 13, color: COLOR.textMuted, marginTop: 4 }}>
              Tidak ada data yang cocok dengan NIK dan Nama yang dimasukkan.
            </div>
          </div>
        )}

        {alertType === "hr_needed" && (
          <div style={{ marginBottom: 16 }}>
            <Alert
              tone="info"
              title="Tindakan Diperlukan"
              description="Nama customer ditemukan namun NIK tidak terdaftar. Segera hubungi bagian HR untuk melakukan verifikasi dan pembaruan data."
            />
          </div>
        )}

        <Button variant="secondary" size="md" onClick={onBack} iconLeft={<Search size={14} />}>
          Cek Data Lain
        </Button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Page — Data Customer (Admin only CRUD)
// ---------------------------------------------------------------------------

type CustomerFormState = Omit<Customer, "status"> & { status: string };

const EMPTY_CUSTOMER: CustomerFormState = {
  code: "",
  nama: "",
  nik: "",
  jenisKelamin: "Laki-laki",
  tglLahir: "",
  alamat: "",
  noHp: "",
  status: "aktif",
};

function CustomerFormFields({
  form,
  onChange,
  error,
  onCloseError,
  idPrefix,
}: {
  form: CustomerFormState;
  onChange: (f: CustomerFormState) => void;
  error: boolean;
  onCloseError: () => void;
  idPrefix: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && (
        <Alert tone="error" title="Code, Nama, dan NIK wajib diisi." onClose={onCloseError} />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
        <Field label="Code" required htmlFor={`${idPrefix}-code`}>
          <TextInput
            id={`${idPrefix}-code`}
            placeholder="1 / 2"
            value={form.code}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...form, code: e.target.value })}
            iconLeft={<Shield size={15} />}
          />
        </Field>
        <Field label="NIK (ID Number)" required htmlFor={`${idPrefix}-nik`}>
          <TextInput
            id={`${idPrefix}-nik`}
            placeholder="Contoh: 095770290"
            value={form.nik}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...form, nik: e.target.value })}
            iconLeft={<Shield size={15} />}
          />
        </Field>
      </div>

      <Field label="Nama Lengkap (Individu Name)" required htmlFor={`${idPrefix}-nama`}>
        <TextInput
          id={`${idPrefix}-nama`}
          placeholder="Contoh: TON OMO"
          value={form.nama}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...form, nama: e.target.value })}
          iconLeft={<User size={15} />}
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Jenis Kelamin" htmlFor={`${idPrefix}-jk`}>
          {/* using <button> toggles: 2-option inline segment for gender */}
          <div style={{ display: "flex", gap: 8 }}>
            {["Laki-laki", "Perempuan"].map((jk) => (
              <button
                key={jk}
                type="button"
                onClick={() => onChange({ ...form, jenisKelamin: jk })}
                style={{
                  ...FONT,
                  flex: 1,
                  height: 38,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${form.jenisKelamin === jk ? COLOR.main : COLOR.border}`,
                  backgroundColor: form.jenisKelamin === jk ? COLOR.main : COLOR.surface,
                  color: form.jenisKelamin === jk ? "#fff" : COLOR.textMuted,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {jk}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Tanggal Lahir" htmlFor={`${idPrefix}-tgl`}>
          <TextInput
            id={`${idPrefix}-tgl`}
            type="date"
            value={form.tglLahir}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...form, tglLahir: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Alamat" htmlFor={`${idPrefix}-alamat`}>
        <TextInput
          id={`${idPrefix}-alamat`}
          placeholder="Jl. Contoh No. 1, Kota"
          value={form.alamat}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...form, alamat: e.target.value })}
        />
      </Field>

      <Field label="No. HP" htmlFor={`${idPrefix}-nohp`}>
        <TextInput
          id={`${idPrefix}-nohp`}
          placeholder="08xxxxxxxxxx"
          value={form.noHp}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...form, noHp: e.target.value })}
        />
      </Field>

      <Field label="Status" htmlFor={`${idPrefix}-status`}>
        <div style={{ display: "flex", gap: 8 }}>
          {["aktif", "nonaktif"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ ...form, status: s })}
              style={{
                ...FONT,
                flex: 1,
                height: 38,
                borderRadius: RADIUS.md,
                border: `1px solid ${form.status === s ? COLOR.main : COLOR.border}`,
                backgroundColor: form.status === s ? COLOR.main : COLOR.surface,
                color: form.status === s ? "#fff" : COLOR.textMuted,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {s === "aktif" ? "Aktif" : "Non-aktif"}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function CustomerDataPage({ group }: { group: Account["group"] }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const isAdmin = group === "Administrator";

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<CustomerFormState>({ ...EMPTY_CUSTOMER });
  const [addError, setAddError] = useState(false);

  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState<CustomerFormState>({ ...EMPTY_CUSTOMER });
  const [editError, setEditError] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");

  async function fetchCustomers() {
    try {
      const res = await fetch(`/api/customer?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok) setCustomers(data);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  function openEdit(c: Customer) {
    setEditTarget(c);
    setEditForm({ code: c.code, nama: c.nama, nik: c.nik, jenisKelamin: c.jenisKelamin, tglLahir: c.tglLahir, alamat: c.alamat, noHp: c.noHp, status: c.status });
    setEditError(false);
  }

  async function handleAdd() {
    if (!addForm.code || !addForm.nama || !addForm.nik) { setAddError(true); return; }
    try {
      const res = await fetch('/api/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm)
      });
      if (res.ok) {
        fetchCustomers();
        setAddForm({ ...EMPTY_CUSTOMER });
        setAddError(false);
        setShowAdd(false);
      } else {
        const data = await res.json();
        alert(data.message || 'Gagal menambahkan customer');
      }
    } catch (err) {
      alert('Koneksi ke server gagal.');
    }
  }

  async function handleEdit() {
    if (!editForm.code || !editForm.nama || !editForm.nik) { setEditError(true); return; }
    try {
      const res = await fetch(`/api/customer/${editTarget!.nik}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        fetchCustomers();
        setEditTarget(null);
        setEditError(false);
      } else {
        const data = await res.json();
        alert(data.message || 'Gagal mengubah customer');
      }
    } catch (err) {
      alert('Koneksi ke server gagal.');
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/customer/${deleteTarget!.nik}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchCustomers();
        setDeleteTarget(null);
      } else {
        const data = await res.json();
        alert(data.message || 'Gagal menghapus customer');
      }
    } catch (err) {
      alert('Koneksi ke server gagal.');
    }
  }

  const filtered = customers;

  const cols = ["CODE", "NAMA LENGKAP", "NIK", "JENIS KELAMIN", "ALAMAT", "STATUS"];
  if (isAdmin) cols.push("AKSI");

  return (
    <>
      <div style={{ ...FONT, maxWidth: 1300, margin: "0 auto", padding: "28px 24px" }}>
        {/* Heading */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Users size={18} color={COLOR.main} />
              <h2 style={{ fontSize: 20, fontWeight: 800, color: COLOR.text, margin: 0, letterSpacing: "-0.02em" }}>
                Data Master Customer
              </h2>
            </div>
            <p style={{ fontSize: 13, color: COLOR.textMuted, margin: 0 }}>
              {isAdmin
                ? "Kelola data master customer — tambah, edit, atau hapus entri."
                : "Lihat data master customer (hanya baca)."}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <TextInput
              placeholder="Cari nama, NIK, atau code..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              iconLeft={<Search size={15} />}
              style={{ width: 240 }}
            />
            {isAdmin && (
              <Button
                variant="primary"
                size="md"
                onClick={() => { setAddForm({ ...EMPTY_CUSTOMER }); setShowAdd(true); }}
                iconLeft={<Plus size={14} />}
              >
                Tambah Customer
              </Button>
            )}
          </div>
        </div>

        {/* Admin-only notice for non-admins */}
        {!isAdmin && (
          <div style={{ marginBottom: 16 }}>
            <Alert
              tone="warning"
              title="Akses Terbatas"
              description="Anda login sebagai Checker. Penambahan, pengeditan, dan penghapusan data customer hanya dapat dilakukan oleh Administrator."
            />
          </div>
        )}

        {/* Summary metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Total Customer", value: customers.length },
            { label: "Code 1", value: customers.filter((c) => c.code === "1").length },
            { label: "Code 2", value: customers.filter((c) => c.code === "2").length },
          ].map((m) => (
            <div key={m.label} style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: RADIUS.lg, padding: "16px 20px" }}>
              <div style={{ fontSize: 12, color: COLOR.textMuted, fontWeight: 500 }}>{m.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: COLOR.text, marginTop: 4 }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: RADIUS.lg, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, ...FONT }}>
              <thead>
                <tr style={{ backgroundColor: COLOR.bg }}>
                  {cols.map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        fontSize: 11.5,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        color: COLOR.textMuted,
                        borderBottom: `1px solid ${COLOR.borderSoft}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => (
                  <tr
                    key={`${c.nik}-${idx}`}
                    style={{ transition: "background-color 0.1s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLOR.hover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}` }}>
                      <Badge tone={c.code === "1" ? "brand" : "info"}>{c.code}</Badge>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}`, fontWeight: 600, color: COLOR.text }}>{c.nama}</td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}`, color: COLOR.textMuted, fontFamily: "monospace", fontSize: 12.5 }}>{c.nik}</td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}`, color: COLOR.textMuted }}>{c.jenisKelamin}</td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}`, color: COLOR.textMuted, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.alamat}</td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}` }}>
                      <Badge tone={c.status === "aktif" ? "success" : "neutral"} dot>
                        {c.status === "aktif" ? "Aktif" : "Non-aktif"}
                      </Badge>
                    </td>
                    {isAdmin && (
                      <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}` }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => openEdit(c)}
                            style={{
                              ...FONT,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              height: 30,
                              padding: "0 10px",
                              borderRadius: RADIUS.md,
                              border: `1px solid ${COLOR.border}`,
                              backgroundColor: COLOR.surface,
                              color: COLOR.main,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLOR.hover; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = COLOR.surface; }}
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            style={{
                              ...FONT,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              height: 30,
                              padding: "0 10px",
                              borderRadius: RADIUS.md,
                              border: `1px solid ${COLOR.dangerBg}`,
                              backgroundColor: COLOR.dangerBg,
                              color: COLOR.danger,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(197,52,26,0.15)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = COLOR.dangerBg; }}
                          >
                            <Trash2 size={12} /> Hapus
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={cols.length} style={{ padding: "40px 24px", textAlign: "center", color: COLOR.textMuted, fontSize: 13 }}>
                      {search ? "Tidak ada data yang sesuai pencarian." : "Belum ada data customer."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, color: COLOR.textSubtle }}>
          Menampilkan {filtered.length} dari {customers.length} data customer
        </div>
      </div>

      {/* Add Modal — Admin only */}
      {isAdmin && (
        <Modal
          open={showAdd}
          onClose={() => { setShowAdd(false); setAddError(false); }}
          title="Tambah Data Customer"
          description="Isi informasi customer baru di bawah ini."
          size="md"
          footer={
            <>
              <Button variant="secondary" size="md" onClick={() => setShowAdd(false)}>Batal</Button>
              <Button variant="primary" size="md" onClick={handleAdd}>Simpan Customer</Button>
            </>
          }
        >
          <CustomerFormFields form={addForm} onChange={setAddForm} error={addError} onCloseError={() => setAddError(false)} idPrefix="cadd" />
        </Modal>
      )}

      {/* Edit Modal — Admin only */}
      {isAdmin && (
        <Modal
          open={!!editTarget}
          onClose={() => { setEditTarget(null); setEditError(false); }}
          title="Edit Data Customer"
          description={`Perbarui data untuk ${editTarget?.nama ?? ""}`}
          size="md"
          footer={
            <>
              <Button variant="secondary" size="md" onClick={() => setEditTarget(null)}>Batal</Button>
              <Button variant="primary" size="md" onClick={handleEdit}>Simpan Perubahan</Button>
            </>
          }
        >
          <CustomerFormFields form={editForm} onChange={setEditForm} error={editError} onCloseError={() => setEditError(false)} idPrefix="cedit" />
        </Modal>
      )}

      {/* Delete Confirm — Admin only */}
      {isAdmin && (
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Hapus Data Customer"
          description={`Apakah Anda yakin ingin menghapus data "${deleteTarget?.nama}" (NIK: ${deleteTarget?.nik})? Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Ya, Hapus"
          destructive
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Page — Change Password (accessible to all authenticated users)
// ---------------------------------------------------------------------------

function ChangePasswordPage({ email, onSuccess }: { email: string; onSuccess?: () => void }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ old?: string; new?: string; confirm?: string; general?: string }>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!oldPassword) e.old = "Password lama wajib diisi.";
    if (!newPassword) e.new = "Password baru wajib diisi.";
    else if (newPassword.length < 6) e.new = "Password baru minimal 6 karakter.";
    if (!confirmPassword) e.confirm = "Konfirmasi password wajib diisi.";
    else if (newPassword !== confirmPassword) e.confirm = "Password baru dan konfirmasi tidak cocok.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, oldPassword, newPassword, confirmPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ general: data.message || 'Gagal mengubah password.' });
        return;
      }
      setSuccess('Password berhasil diubah. Silakan gunakan password baru saat login berikutnya.');
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess?.();
    } catch (err) {
      setErrors({ general: 'Koneksi ke server gagal.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ ...FONT, maxWidth: 560, margin: "0 auto", padding: "36px 24px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Lock size={18} color={COLOR.main} />
          <h2 style={{ fontSize: 20, fontWeight: 800, color: COLOR.text, margin: 0, letterSpacing: "-0.02em" }}>
            Ubah Password
          </h2>
        </div>
        <p style={{ fontSize: 13, color: COLOR.textMuted, margin: 0 }}>
          Perbarui password akun Anda untuk keamanan yang lebih baik.
        </p>
      </div>

      <div
        style={{
          backgroundColor: COLOR.surface,
          border: `1px solid ${COLOR.border}`,
          borderRadius: RADIUS.lg,
          padding: 28,
          boxShadow: SHADOW.sm,
        }}
      >
        {success && (
          <div style={{ marginBottom: 16 }}>
            <Alert tone="success" title={success} onClose={() => setSuccess(null)} />
          </div>
        )}
        {errors.general && (
          <div style={{ marginBottom: 16 }}>
            <Alert tone="error" title={errors.general} onClose={() => setErrors((p) => ({ ...p, general: undefined }))} />
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Field
            label="Password Lama"
            required
            htmlFor="old-password"
            status={errors.old ? "error" : "default"}
            helper={errors.old}
          >
            <TextInput
              id="old-password"
              type={showOld ? "text" : "password"}
              placeholder="Masukkan password lama"
              value={oldPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setOldPassword(e.target.value); setErrors((p) => ({ ...p, old: undefined })); }}
              status={errors.old ? "error" : "default"}
              iconLeft={<Lock size={15} />}
              iconRight={
                <button
                  type="button"
                  onClick={() => setShowOld((v) => !v)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0, color: "inherit" }}
                  aria-label={showOld ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />
          </Field>

          <Field
            label="Password Baru"
            required
            htmlFor="new-password"
            status={errors.new ? "error" : "default"}
            helper={errors.new}
          >
            <TextInput
              id="new-password"
              type={showNew ? "text" : "password"}
              placeholder="Masukkan password baru"
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setNewPassword(e.target.value); setErrors((p) => ({ ...p, new: undefined })); }}
              status={errors.new ? "error" : "default"}
              iconLeft={<Lock size={15} />}
              iconRight={
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0, color: "inherit" }}
                  aria-label={showNew ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />
          </Field>

          <Field
            label="Konfirmasi Password Baru"
            required
            htmlFor="confirm-password"
            status={errors.confirm ? "error" : "default"}
            helper={errors.confirm}
          >
            <TextInput
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirm: undefined })); }}
              status={errors.confirm ? "error" : "default"}
              iconLeft={<Lock size={15} />}
              iconRight={
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0, color: "inherit" }}
                  aria-label={showConfirm ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />
          </Field>

          <div style={{ paddingTop: 4 }}>
            <Button variant="primary" size="lg" fullWidth disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Password Baru"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root App — Page Router
// ---------------------------------------------------------------------------

export default function App() {
  {/* MARKER-MAKE-KIT-INVOKED */ }
  {/* MARKER-MAKE-KIT-DISCOVERY-READ */ }
  const [page, setPage] = useState<Page>("login");
  const [hasilData, setHasilData] = useState<CekResult | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginGroup, setLoginGroup] = useState<Account["group"]>("Administrator");
  const [loginNama, setLoginNama] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [addUserTrigger, setAddUserTrigger] = useState(false);

  const isAuthenticated = page !== "login" && page !== "otp";

  function handleLogout() {
    setPage("login");
    setHasilData(null);
    setLoginEmail("");
    setLoginNama("");
  }

  function handleNavigate(p: Page) {
    setPage(p);
  }

  return (
    <div>
      {page === "login" && (
        <LoginPage
          onLogin={(email, group, nama) => {
            setLoginEmail(email);
            setLoginGroup(group);
            setLoginNama(nama);
            setPage("otp");
          }}
        />
      )}
      {page === "otp" && (
        <OtpPage
          email={loginEmail}
          onVerify={(group) => {
            setPage(group === "Checker" ? "cek" : "dashboard");
          }}
        />
      )}
      {isAuthenticated && (
        <AppLayout
          onLogout={handleLogout}
          group={loginGroup}
          nama={loginNama}
          currentPage={page}
          onNavigate={handleNavigate}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        >
          {page === "dashboard" && (
            <DashboardPage
              group={loginGroup}
              triggerAddUser={addUserTrigger}
              onTriggerHandled={() => setAddUserTrigger(false)}
            />
          )}
          {page === "customers" && loginGroup === "Administrator" && <CustomerDataPage group={loginGroup} />}
          {page === "cek" && (
            <CekPage
              onHasil={(r) => {
                setHasilData(r);
                setPage("hasil");
              }}
            />
          )}
          {page === "hasil" && hasilData && (
            <HasilPage result={hasilData} onBack={() => setPage("cek")} />
          )}
          {page === "change-password" && (
            <ChangePasswordPage email={loginEmail} />
          )}
        </AppLayout>
      )}
    </div>
  );
}
