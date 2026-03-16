import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { theme } from "../../theme/theme";

export interface RegisterFormData {
  rollNo: string;
  empId: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: "student" | "institution";
}

interface RegisterProps {
  onSubmit: (data: RegisterFormData) => void;
  loading?: boolean;
}

const Register: React.FC<RegisterProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    rollNo: "",
    empId: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const studentFields = [
    { label: "Roll No", placeholder: "Eg: 21CSR001", key: "rollNo", type: "text" },
    { label: "Full Name", placeholder: "Eg: Alice", key: "name", type: "text" },
    { label: "Email", placeholder: "Eg: abc@gmail.com", key: "email", type: "email" },
    { label: "Phone No", placeholder: "Eg: 98674xxxxx", key: "phone", type: "text" },
    { label: "Password", placeholder: "Enter password", key: "password", type: "password" },
    { label: "Confirm Password", placeholder: "Confirm password", key: "confirmPassword", type: "password" },
  ];

  const institutionFields = [
    { label: "EmpID", placeholder: "Eg: FAC123", key: "empId", type: "text" },
    { label: "Full Name", placeholder: "Eg: Dr. Smith", key: "name", type: "text" },
    { label: "Email", placeholder: "Eg: smith@institution.com", key: "email", type: "email" },
    { label: "Phone No", placeholder: "Eg: 98674xxxxx", key: "phone", type: "text" },
    { label: "Password", placeholder: "Enter password", key: "password", type: "password" },
    { label: "Confirm Password", placeholder: "Confirm password", key: "confirmPassword", type: "password" },
  ];

  const fields = formData.role === "student" ? studentFields : institutionFields;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Role Switcher */}
      <div className="flex items-center justify-end gap-6 border-b border-slate-200 pb-3 mb-2">
        {(["institution", "student"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setFormData((p) => ({ ...p, role: r }))}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              transition: "all 0.2s",
              background: formData.role === r ? theme.colors.brand : "transparent",
              color: formData.role === r ? "#fff" : "#64748b",
              border: "none",
              cursor: "pointer",
            }}
          >
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      {/* Fields */}
      {fields.map((field) => {
        const isPassword = field.key === "password" || field.key === "confirmPassword";
        const showNow = field.key === "password" ? showPassword : showConfirmPassword;
        const toggleShow = field.key === "password"
          ? () => setShowPassword((v) => !v)
          : () => setShowConfirmPassword((v) => !v);

        return (
          <div key={field.key} className="space-y-1.5">
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block" }}>
              {field.label} <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div className="relative">
              <input
                type={isPassword ? (showNow ? "text" : "password") : field.type}
                placeholder={field.placeholder}
                value={formData[field.key as keyof RegisterFormData]}
                required
                disabled={loading}
                onChange={(e) => {
                  let val = e.target.value;
                  if (field.key === "name") val = val.replace(/[^a-zA-Z\s]/g, "");
                  if (field.key === "phone") val = val.replace(/[^0-9]/g, "");
                  setFormData((p) => ({ ...p, [field.key]: val }));
                }}
                style={{
                  width: "100%",
                  padding: "9px 13px",
                  paddingRight: isPassword ? "40px" : "13px",
                  borderRadius: "8px",
                  border: "1.5px solid #c4b5fd",
                  fontSize: "13px",
                  color: "#1e293b",
                  background: "#f8fafc",
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                  opacity: loading ? 0.6 : 1,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#1e1a6b")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#c4b5fd")}
              />
              {isPassword && (
                <button
                  type="button"
                  onClick={toggleShow}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showNow ? <EyeOff size={18} style={{ color: "#1e1a6b" }} /> : <Eye size={18} style={{ color: "#1e1a6b" }} />}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-white font-bold transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.brand}, ${theme.colors.brandDark})`,
            fontSize: "14px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </div>
    </form>
  );
};

export default Register;