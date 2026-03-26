import React, { useState, useEffect, useCallback } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Mail, Lock, Wallet, LogIn, AlertCircle, CheckCircle2 } from "lucide-react";

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

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [hasMetaMask, setHasMetaMask] = useState<boolean | null>(null); // null = checking

  // 🔧 IMPROVED: More robust MetaMask detection with multiple checks
  const checkMetaMask = useCallback(() => {
    const ethereum = (window as any).ethereum;
    
    // Check multiple conditions for MetaMask
    const isMetaMaskInstalled = !!(
      ethereum && 
      (ethereum.isMetaMask || ethereum.providers?.some((p: any) => p.isMetaMask))
    );
    
    console.log("MetaMask check:", { 
      isMetaMaskInstalled, 
      ethereum: !!ethereum,
      isMetaMask: ethereum?.isMetaMask,
      providers: ethereum?.providers?.length 
    });
    
    setHasMetaMask(isMetaMaskInstalled);
    return isMetaMaskInstalled ? ethereum : null;
  }, []);

  // Check for MetaMask on mount and when window loads
  useEffect(() => {
    // Immediate check
    checkMetaMask();
    
    // Check after short delays (MetaMask injects asynchronously)
    const timers = [500, 1000, 2000].map(delay => 
      setTimeout(checkMetaMask, delay)
    );
    
    // Also check when window finishes loading
    if (document.readyState === 'complete') {
      checkMetaMask();
    } else {
      window.addEventListener('load', checkMetaMask);
    }

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('load', checkMetaMask);
    };
  }, [checkMetaMask]);

  // Listen for account changes
  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("Accounts changed:", accounts);
      if (accounts.length > 0) {
        setFormData((prev) => ({ ...prev, publicKey: accounts[0] }));
        setConnectionError(null);
      } else {
        setFormData((prev) => ({ ...prev, publicKey: "" }));
      }
    };

    const handleChainChanged = () => {
      // MetaMask recommends reloading the page on chain change
      console.log("Chain changed, reloading...");
      window.location.reload();
    };

    // Subscribe to events
    if (ethereum.on) {
      ethereum.on("accountsChanged", handleAccountsChanged);
      ethereum.on("chainChanged", handleChainChanged);
    }
    
    // Check if already connected (silently)
    const checkExistingConnection = async () => {
      try {
        const accounts = await ethereum.request?.({ method: "eth_accounts" });
        if (accounts && accounts.length > 0) {
          setFormData((prev) => ({ ...prev, publicKey: accounts[0] }));
        }
      } catch (err) {
        console.log("eth_accounts error:", err);
      }
    };
    
    checkExistingConnection();

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
        ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔧 FIXED: Proper connect wallet function with guaranteed user gesture
  const connectWallet = async () => {
    console.log("🔥 CONNECT WALLET CLICKED");
    setConnectionError(null);
    setIsConnecting(true);

    try {
      const ethereum = checkMetaMask();
      
      if (!ethereum) {
        throw new Error("MetaMask not found. Please install MetaMask extension.");
      }

      console.log("Requesting accounts from MetaMask...");
      
      // 🔧 CRITICAL: This MUST be triggered by a user gesture (button click)
      // The popup will only show if called in response to user interaction
      let accounts;
      
      try {
        // Primary method: eth_requestAccounts (this triggers the popup)
        accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
      } catch (reqError: any) {
        console.error("eth_requestAccounts error:", reqError);
        
        // Handle specific error codes
        if (reqError.code === 4001) {
          throw new Error("You rejected the connection request in MetaMask.");
        } else if (reqError.code === -32002) {
          throw new Error("MetaMask is already processing a request. Please check the MetaMask extension icon in your browser toolbar.");
        } else if (reqError.message?.includes("User rejected")) {
          throw new Error("Connection rejected. Please approve the request in MetaMask.");
        }
        
        // Fallback for older MetaMask versions
        if (ethereum.enable) {
          console.log("Trying legacy enable() method...");
          accounts = await ethereum.enable();
        } else {
          throw reqError;
        }
      }

      console.log("Accounts received:", accounts);

      if (accounts && accounts.length > 0) {
        setFormData((prev) => ({ ...prev, publicKey: accounts[0] }));
        setConnectionError(null);
        console.log("✅ Wallet connected:", accounts[0]);
      } else {
        throw new Error("No accounts returned. Please create an account in MetaMask.");
      }
    } catch (error: any) {
      console.error("❌ Connection error:", error);
      
      let errorMessage = "Failed to connect wallet";
      
      if (error.code === 4001 || error.message?.includes("rejected")) {
        errorMessage = "You rejected the connection request in MetaMask.";
      } else if (error.code === -32002 || error.message?.includes("pending")) {
        errorMessage = "MetaMask is already processing a request. Please check the MetaMask extension icon in your browser toolbar.";
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
    
    if (!formData.email || !formData.password || !formData.publicKey) {
      console.log("Validation failed:", formData);
      return;
    }
    
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

      {/* Wallet Connection */}
      <div className="space-y-1.5">
        <Label
          className="text-slate-700 font-semibold flex items-center gap-2"
          style={{ fontSize: "12px" }}
        >
          <Wallet className="w-4 h-4" /> Wallet Connection{" "}
          <span style={{ color: "#ef4444" }}>*</span>
        </Label>

        {hasMetaMask === false && (
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

        {hasMetaMask === null && (
          <div 
            className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2"
            style={{ fontSize: "12px" }}
          >
            <div className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
            <span className="text-slate-600">Checking for MetaMask...</span>
          </div>
        )}

        {/* 🔧 FIXED: Using onClick instead of onMouseDown for proper event handling */}
        <button
          type="button"
          onClick={connectWallet}  // Changed from onMouseDown to onClick
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
          <div 
            className="p-2 rounded bg-red-50 border border-red-200 flex items-start gap-1.5"
            style={{ fontSize: "11px", color: "#ef4444" }}
          >
            <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span>{connectionError}</span>
          </div>
        )}

        <p style={{ fontSize: "11px", color: "#64748b" }}>
          {formData.publicKey 
            ? "Wallet connected. Click button to change account." 
            : "Click to open MetaMask and select an account."
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