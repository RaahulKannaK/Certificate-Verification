import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import axios from "@/api/axios";
import { toast } from "sonner";
import { User } from "@/types";

/* ============================================================
   🔐 CONTEXT TYPE
============================================================ */
interface AuthContextType {
  user: User | null;
  login: (
    loginParams: string | { email?: string; password?: string; publicKey: string; userData?: any }
  ) => Promise<boolean>;
  logout: () => void;
  createAccount: (
    userData: Omit<
      User,
      "id" | "publicKey" | "walletPublicKey" | "walletPrivateKey" | "biometricSetup"
    >
  ) => Promise<User | null>;
  setupBiometric: (
    type: "fingerprint" | "face",
    image: string
  ) => Promise<boolean>;
  verifyBiometric: (image: string) => Promise<boolean>;
  refreshBiometricStatus: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ============================================================
   🔐 AUTH PROVIDER
============================================================ */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  /* ============================================================
     💾 PERSIST USER
  ============================================================ */
  const persistUser = (userData: User | null) => {
    if (userData) {
      localStorage.setItem("auth_user", JSON.stringify(userData));
      localStorage.setItem("is_logged_in", "true");
    } else {
      localStorage.removeItem("auth_user");
      localStorage.removeItem("is_logged_in");
    }
  };

  /* ============================================================
     🔄 REFRESH BIOMETRIC STATUS FROM DATABASE
  ============================================================ */
  const refreshBiometricStatus = async (email: string): Promise<void> => {
    try {
      const res = await axios.get(`/biometric/status/${email}`);
      const data = res.data;

      setUser((prev) => {
        if (!prev) return prev;

        const updatedUser: User = {
          ...prev,
          biometricSetup: data.biometricSetup ?? false,
          biometricType: data.biometricType ?? null,
        };

        persistUser(updatedUser);
        console.log("🔄 Biometric status refreshed:", updatedUser);

        return updatedUser;
      });
    } catch (err) {
      console.error("Failed to refresh biometric status:", err);
    }
  };

  /* ============================================================
     🔄 RESTORE USER ON PAGE REFRESH
  ============================================================ */
  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user");

    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);

      // 🔥 Always verify biometric from DB (trust backend)
      if (parsed.email) {
        refreshBiometricStatus(parsed.email);
      }
    }
  }, []);

  /* ============================================================
     📝 CREATE ACCOUNT
  ============================================================ */
  const createAccount = async (
    userData: Omit<
      User,
      "id" | "publicKey" | "walletPublicKey" | "walletPrivateKey" | "biometricSetup"
    >
  ): Promise<User | null> => {
    try {
      const response = await axios.post("/signup", userData);
      toast.success(response.data.message || "Account created successfully!");
      return response.data.user || null;
    } catch (err: any) {
      console.error("Signup failed:", err);
      toast.error(err.response?.data?.message || "Signup failed");
      return null;
    }
  };

  /* ============================================================
     🔐 LOGIN (Updated for Email + Password + Public Key)
  ============================================================ */
  const login = async (
    loginParams: string | { email?: string; password?: string; publicKey: string; userData?: any }
  ): Promise<boolean> => {
    let publicKey: string;
    let userData: any = null;

    if (typeof loginParams === "string") {
      publicKey = loginParams.trim();
    } else {
      publicKey = loginParams.publicKey.trim();
      userData = loginParams.userData;
    }

    if (!publicKey) {
      toast.error("Public key is required");
      return false;
    }

    try {
      let u: any;

      if (userData) {
        // If userData is already provided (from explicit API call in component)
        u = userData;
      } else {
        // Standard login via publicKey only
        const response = await axios.post("/login", {
          publicKey,
        });
        u = response.data.user;
      }

      if (!u) throw new Error("User not found");

      const mappedUser: User = {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.name || "User",
        age: u.age,
        phone: u.phone,
        email: u.email,
        role: u.role,

        publicKey: u.publicKey || u.walletPublicKey || "",
        privateKey: u.privateKey || u.walletPrivateKey || "",
        walletPublicKey: u.walletPublicKey || u.publicKey || "",
        walletPrivateKey: u.walletPrivateKey || u.privateKey || "",

        biometricSetup: false,   // 🔥 always revalidate
        biometricType: null,
      };

      setUser(mappedUser);
      persistUser(mappedUser);

      // 🔥 Fetch biometric status from DB (Non-blocking)
      if (mappedUser.email) {
        refreshBiometricStatus(mappedUser.email);
      }

      console.log("✅ Logged in user:", mappedUser);

      return true;
    } catch (err: any) {
      console.error("❌ Login failed:", err);
      toast.error(err.response?.data?.message || "Login failed");
      return false;
    }
  };

  /* ============================================================
     🚪 LOGOUT
  ============================================================ */
  const logout = () => {
    setUser(null);
    persistUser(null);
    toast.success("Logged out successfully!");
  };

  /* ============================================================
     🔐 SETUP BIOMETRIC
  ============================================================ */
  const setupBiometric = async (
    type: "fingerprint" | "face",
    image: string
  ): Promise<boolean> => {
    if (!user || !image) {
      toast.error("Missing biometric data");
      return false;
    }

    try {
      const res = await axios.post("/biometric/face", {
        email: user.email,
        image,
      });

      if (!res.data.success) {
        toast.error(res.data.message || "Biometric setup failed");
        return false;
      }

      // 🔥 Always trust backend — refresh status
      await refreshBiometricStatus(user.email);

      toast.success(
        type === "face"
          ? "Face biometric enrolled successfully"
          : "Fingerprint enrolled successfully"
      );

      return true;
    } catch (err: any) {
      console.error("Biometric setup error:", err);
      toast.error(err.response?.data?.message || "Setup error");
      return false;
    }
  };

  /* ============================================================
     ✅ VERIFY BIOMETRIC
  ============================================================ */
  const verifyBiometric = async (image: string): Promise<boolean> => {
    if (!user || !image) {
      toast.error("Missing verification data");
      return false;
    }

    try {
      const res = await axios.post("/biometric/verify-face", {
        email: user.email,
        image,
      });

      if (!res.data.success) {
        toast.error(res.data.message || "Face verification failed");
        return false;
      }

      toast.success("Face verified successfully");
      return true;
    } catch (err: any) {
      console.error("Biometric verify error:", err);
      toast.error(err.response?.data?.message || "Verification error");
      return false;
    }
  };


  /* ============================================================
     PROVIDER
  ============================================================ */
  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        createAccount,
        setupBiometric,
        verifyBiometric,
        refreshBiometricStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* ============================================================
   🔐 USE AUTH HOOK
============================================================ */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};