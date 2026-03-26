import React, { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Mail, Lock, Wallet, LogIn, AlertCircle, CheckCircle2 } from "lucide-react";

export interface LoginFormData {
  email: string;
  password: string;
  publicKey: string; // Keeping as publicKey to match your server
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

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [hasMetaMask, setHasMetaMask] = useState<boolean>(false);

  // Check for MetaMask on mount
  useEffect(() => {
    const checkMetaMask = () => {
      const ethereum = (window as any).ethereum;
      const isMetaMaskInstalled = !!(ethereum && ethereum.isMetaMask);
      console.log("MetaMask detected:", isMetaMaskInstalled);
      setHasMetaMask(isMetaMaskInstalled);
    };

    checkMetaMask();
    window.addEventListener('load', checkMetaMask);
    const timeoutCheck = setTimeout(checkMetaMask, 1000);

    return () => {
      window.removeEventListener('load', checkMetaMask);
      clearTimeout(timeoutCheck);
    };
  }, []);

  // Listen for account changes
  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("Accounts changed:", accounts);
      if (accounts.length > 0) {
        setFormData((prev) => ({ ...prev, publicKey: accounts[0] }));
      } else {
        setFormData((prev) => ({ ...prev, publicKey: "" }));
      }
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const connectWallet = async () => {
    console.log("🔥 CONNECT WALLET CLICKED");
    setConnectionError(null);
    setIsConnecting(true);

    try {
      const ethereum = (window as any).ethereum;
      
      if (!ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
      }

      console.log("✅ MetaMask found, requesting accounts...");
      
      // Request accounts - this opens MetaMask popup
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("✅ Accounts received:", accounts);

      if (accounts && accounts.length > 0) {
        setFormData((prev) => ({ ...prev, publicKey: accounts[0] }));
        setConnectionError(null);
        console.log("✅ Wallet connected:", accounts[0]);
      } else {
        throw new Error("No accounts found. Please unlock MetaMask and try again.");
      }
    } catch (error: any) {
      console.error("❌ Wallet connection error:", error);
      
      let errorMessage = "Failed to connect wallet";
      
      if (error.code === 4001) {
        errorMessage = "You rejected the connection request in MetaMask.";
      } else if (error.code === -32002) {
        errorMessage = "MetaMask is already open. Please check your browser extensions.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setConnectionError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    if (!formData.email || !formData.password || !formData.publicKey) {
      console.log("❌ Form validation failed:", formData);
      return;
    }
    
    console.log("✅ Submitting login:", {
      email: formData.email,
      publicKey: formData.publicKey,
      password: "***"
    });
    
    onSubmit(formData);
  };

  const isFormValid = formData.email && formData.password && formData.publicKey;

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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

      {/* Wallet Connection - REPLACES the old Public Key Input */}
      <div className="space-y-1.5">
        <Label
          className="text-slate-700 font-semibold flex items-center gap-2"
          style={{ fontSize: "12px" }}
        >
          <Wallet className="w-4 h-4" /> Wallet Connection{" "}
          <span style={{ color: "#ef4444" }}>*</span>
        </Label>

        {!hasMetaMask && (
          <div 
            className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2"
            style={{ fontSize: "12px" }}
          >
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-amber-800">
              <p className="font-medium">MetaMask not detected</p>
              <p className="mt-1">
                Please{" "}
                <a 
                  href="https://metamask.io/download/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline font-semibold hover:text-amber-900"
                >
                  install MetaMask
                </a>{" "}
                and refresh the page.
              </p>
            </div>
          </div>
        )}

        {/* Connect Wallet Button */}
        <button
          type="button"
          onClick={connectWallet}
          disabled={isConnecting || loading || !hasMetaMask}
          className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            formData.publicKey 
              ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-100" 
              : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg"
          }`}
          style={{
            fontSize: "13px",
            height: "44px",
          }}
        >
          {formData.publicKey ? (
            <CheckCircle2 size={18} />
          ) : (
            <Wallet size={18} />
          )}
          {isConnecting 
            ? "Connecting..." 
            : formData.publicKey 
              ? `Connected: ${formatAddress(formData.publicKey)}`
              : "Connect MetaMask"
          }
        </button>

        {connectionError && (
          <p className="flex items-center gap-1.5 mt-2" style={{ fontSize: "11px", color: "#ef4444" }}>
            <AlertCircle className="w-3 h-3" />
            {connectionError}
          </p>
        )}

        <p style={{ fontSize: "11px", color: "#64748b" }}>
          {formData.publicKey 
            ? "Wallet connected successfully. You can now login." 
            : "Click to connect your MetaMask wallet."
          }
        </p>
      </div>

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading || !isFormValid}
          className="w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-white font-bold transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, #1e1a6b, #2c258e)",
            fontSize: "14px",
          }}
        >
          <LogIn size={16} />
          {loading ? "Logging in..." : "Login"}
        </button>
        
        {!isFormValid && (
          <p className="text-center mt-2" style={{ fontSize: "11px", color: "#94a3b8" }}>
            Please fill in all fields and connect your wallet
          </p>
        )}
      </div>
    </form>
  );
};

export default Login;