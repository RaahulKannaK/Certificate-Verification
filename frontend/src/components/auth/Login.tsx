import React, { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Mail, Lock, Key, LogIn } from "lucide-react";

export interface LoginFormData {
  email: string;
  password: string;
  publicKey: string;
}

interface LoginProps {
  onSubmit: (data: LoginFormData) => void;
  loading?: boolean;
}

const Login: React.FC<LoginProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    publicKey: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email */}
      <div className="space-y-1.5">
        <Label
          htmlFor="email"
          className="text-slate-700 font-semibold flex items-center gap-2"
          style={{ fontSize: "12px" }}
        >
          <Mail className="w-4 h-4" /> Email{" "}
          <span style={{ color: "#ef4444" }}>*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          className="bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400"
          style={{ height: "40px", fontSize: "13px" }}
          disabled={loading}
          autoComplete="email"
          required
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label
          htmlFor="password"
          className="text-slate-700 font-semibold flex items-center gap-2"
          style={{ fontSize: "12px" }}
        >
          <Lock className="w-4 h-4" /> Password{" "}
          <span style={{ color: "#ef4444" }}>*</span>
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          className="bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400"
          style={{ height: "40px", fontSize: "13px" }}
          disabled={loading}
          autoComplete="current-password"
          required
        />
      </div>

      {/* Public Key */}
      <div className="space-y-1.5">
        <Label
          htmlFor="publicKey"
          className="text-slate-700 font-semibold flex items-center gap-2"
          style={{ fontSize: "12px" }}
        >
          <Key className="w-4 h-4" /> Public Key{" "}
          <span style={{ color: "#ef4444" }}>*</span>
        </Label>
        <Input
          id="publicKey"
          name="publicKey"
          placeholder="0x..."
          value={formData.publicKey}
          onChange={handleChange}
          className="font-mono bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400"
          style={{ height: "40px", fontSize: "13px" }}
          disabled={loading}
          required
        />
        <p style={{ fontSize: "11px", color: "#64748b" }}>
          Your public key was provided when you created your wallet
        </p>
      </div>

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-white font-bold transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
          style={{
            background: "linear-gradient(135deg, #1e1a6b, #2c258e)",
            fontSize: "14px",
          }}
        >
          <LogIn size={16} />
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </form>
  );
};

export default Login;
