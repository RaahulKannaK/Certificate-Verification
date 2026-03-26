import React, { useState, useEffect, useCallback } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Mail, Lock, Wallet, LogIn, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

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
  const [hasMetaMask, setHasMetaMask] = useState<boolean | null>(null);

  // Check for MetaMask with better detection
  const checkMetaMask = useCallback(() => {
    const ethereum = (window as any).ethereum;
    
    // Handle multiple wallet providers (MetaMask, Coinbase, etc.)
    let provider = ethereum;
    if (ethereum?.providers) {
      provider = ethereum.providers.find((p: any) => p.isMetaMask) || ethereum;
    }
    
    const isMetaMaskInstalled = !!(provider && provider.isMetaMask);
    
    console.log("MetaMask check:", { 
      isMetaMaskInstalled, 
      hasEthereum: !!ethereum,
      isMetaMask: provider?.isMetaMask,
      hasProviders: !!ethereum?.providers
    });
    
    setHasMetaMask(isMetaMaskInstalled);
    return isMetaMaskInstalled ? provider : null;
  }, []);

  useEffect(() => {
    checkMetaMask();
    const timers = [500, 1500].map(delay => setTimeout(checkMetaMask, delay));
    return () => timers.forEach(clearTimeout);
  }, [checkMetaMask]);

  // Listen for account changes
  useEffect(() => {
    const ethereum = checkMetaMask();
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

    if (ethereum.on) {
      ethereum.on("accountsChanged", handleAccountsChanged);
    }

    // Check existing connection silently
    ethereum.request?.({ method: "eth_accounts" })
      .then((accounts: string[]) => {
        if (accounts.length > 0) {
          setFormData((prev) => ({ ...prev, publicKey: accounts[0] }));
        }
      })
      .catch(console.error);

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, [hasMetaMask]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔥 FIXED: Force popup with wallet_requestPermissions
  const connectWallet = async () => {
    console.log("🔥 CONNECT WALLET CLICKED");
    setConnectionError(null);
    setIsConnecting(true);

    try {
      const ethereum = checkMetaMask();
      
      if (!ethereum) {
        throw new Error("MetaMask not found. Please install MetaMask extension.");
      }

      console.log("Requesting accounts...");

      let accounts;
      
      try {
        // 🔥 METHOD 1: Force popup every time using wallet_requestPermissions
        // This will always show the popup, even if already connected
        await ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }]
        });
        
        // After permission granted, get the accounts
        accounts = await ethereum.request({
          method: "eth_requestAccounts"
        });
        
      } catch (permError: any) {
        console.log("wallet_requestPermissions failed, trying standard method:", permError);
        
        // 🔥 METHOD 2: Standard request (uses cached permission if available)
        try {
          accounts = await ethereum.request({
            method: "eth_requestAccounts"
          });
        } catch (reqError: any) {
          console.error("eth_requestAccounts error:", reqError);
          
          if (reqError.code === 4001) {
            throw new Error("You rejected the connection request.");
          } else if (reqError.code === -32002) {
            throw new Error("MetaMask is already processing a request. Check the extension icon.");
          }
          
          // Legacy fallback
          if (ethereum.enable) {
            accounts = await ethereum.enable();
          } else {
            throw reqError;
          }
        }
      }

      console.log("Accounts received:", accounts);

      if (accounts && accounts.length > 0) {
        setFormData((prev) => ({ ...prev, publicKey: accounts[0] }));
        setConnectionError(null);
        console.log("✅ Wallet connected:", accounts[0]);
      } else {
        throw new Error("No accounts returned.");
      }
    } catch (error: any) {
      console.error("❌ Connection error:", error);
      
      let errorMessage = "Failed to connect wallet";
      
      if (error.code === 4001 || error.message?.includes("rejected")) {
        errorMessage = "Connection rejected by user.";
      } else if (error.code === -32002) {
        errorMessage = "Request already pending. Check MetaMask extension.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setConnectionError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setFormData(prev => ({ ...prev, publicKey: "" }));
    setConnectionError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.publicKey) {
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
        <Label htmlFor="email" className="text-slate-700 font-semibold flex items-center gap-2 text-xs">
          <Mail className="w-4 h-4" /> Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          className="bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900 h-10 text-sm"
          disabled={loading}
          autoComplete="email"
          required
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-slate-700 font-semibold flex items-center gap-2 text-xs">
          <Lock className="w-4 h-4" /> Password <span className="text-red-500">*</span>
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          className="bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900 h-10 text-sm"
          disabled={loading}
          autoComplete="current-password"
          required
        />
      </div>

      {/* Wallet Connection */}
      <div className="space-y-1.5">
        <Label className="text-slate-700 font-semibold flex items-center gap-2 text-xs">
          <Wallet className="w-4 h-4" /> Wallet Connection <span className="text-red-500">*</span>
        </Label>

        {hasMetaMask === false && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">MetaMask not detected</p>
              <p className="mt-1">
                Please <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-amber-900">install MetaMask</a> and refresh.
              </p>
            </div>
          </div>
        )}

        {hasMetaMask === null && (
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs text-slate-600">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Checking for MetaMask...</span>
          </div>
        )}

        {/* Connect Button */}
        <button
          type="button"
          onClick={connectWallet}
          disabled={isConnecting || loading || !hasMetaMask}
          className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            formData.publicKey 
              ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-100" 
              : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg"
          }`}
          style={{ height: "44px", fontSize: "13px" }}
        >
          {formData.publicKey ? (
            <>
              <CheckCircle2 size={18} />
              <span>Connected: {formatAddress(formData.publicKey)}</span>
            </>
          ) : (
            <>
              <Wallet size={18} />
              <span>{isConnecting ? "Connecting..." : "Connect MetaMask"}</span>
            </>
          )}
        </button>

        {/* Disconnect option */}
        {formData.publicKey && (
          <button
            type="button"
            onClick={disconnectWallet}
            className="w-full text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Disconnect wallet
          </button>
        )}

        {connectionError && (
          <div className="p-2 rounded bg-red-50 border border-red-200 flex items-start gap-1.5 text-xs text-red-500">
            <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span>{connectionError}</span>
          </div>
        )}

        <p className="text-xs text-slate-500">
          {formData.publicKey 
            ? "Wallet connected. Click to switch account." 
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
          <p className="text-center mt-2 text-xs text-slate-400">
            Please fill in all fields and connect your wallet
          </p>
        )}
      </div>
    </form>
  );
};

export default Login;