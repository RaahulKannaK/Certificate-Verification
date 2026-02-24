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
  isLoading: boolean; // ✅ NEW
  login: (publicKey: string) => Promise<boolean>;
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
  const [isLoading, setIsLoading] = useState(true); // ✅ NEW — true until session restore done

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
  // ✅ NEW — async restore so isLoading blocks UI until session is ready
  useEffect(() => {
    const restore = async () => {
      try {
        const storedUser = localStorage.getItem("auth_user");

        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);

          // 🔥 Always verify biometric from DB (trust backend)
          if (parsed.email) {
            await refreshBiometricStatus(parsed.email);
          }
        }
      } catch (err) {
        console.error("Failed to restore user session:", err);
        // Corrupted storage — clear it safely
        localStorage.removeItem("auth_user");
        localStorage.removeItem("is_logged_in");
      } finally {
        setIsLoading(false); // ✅ NEW — unblock UI regardless of success/failure
      }
    };

    restore();
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
     🔐 LOGIN
  ============================================================ */
  const login = async (publicKey: string): Promise<boolean> => {
    if (!publicKey.trim()) {
      toast.error("Public key is required");
      return false;
    }

    try {
      const response = await axios.post("/login", {
        publicKey: publicKey.trim(),
      });

      const u = response.data.user;
      if (!u) throw new Error("User not found");

      const mappedUser: User = {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        age: u.age,
        phone: u.phone,
        email: u.email,
        role: u.role,

        walletPublicKey: u.walletPublicKey || u.publicKey || "",
        walletPrivateKey: u.walletPrivateKey || "",

        biometricSetup: false,   // 🔥 always revalidate
        biometricType: null,
      };

      setUser(mappedUser);
      persistUser(mappedUser);

      // 🔥 Fetch biometric status from DB
      await refreshBiometricStatus(mappedUser.email);

      toast.success("Login successful!");
      console.log("✅ Logged in user:", mappedUser);

      return true;
    } catch (err: any) {
      console.error("Login failed:", err);
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
        isLoading, // ✅ NEW — expose to PrivateRoute / Layout
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