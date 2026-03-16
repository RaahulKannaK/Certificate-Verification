import React from "react";
import { useNavigate } from "react-router-dom";
import { HeroSection } from "../components/Home/HeroSection";
import { SigningView } from "../components/signing/SigningView";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";

/* 🔹 views that still live in Index */
type View = "landing" | "sign-certificate";

const Index: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("landing");

  const [selectedCredentialId, setSelectedCredentialId] = useState<string | null>(null);

  /* Auto-redirect on auth */
  React.useEffect(() => {
    if (user) {
      navigate(user.role === "institution" ? "/institution/dashboard" : "/student/dashboard");
    }
  }, [user]);

  switch (view) {
    case "sign-certificate":
      if (!selectedCredentialId) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <p className="text-red-500">No certificate selected.</p>
            <button onClick={() => setView("landing")}>Go Back</button>
          </div>
        );
      }
      return (
        <SigningView
          credentialId={selectedCredentialId}
          onBack={() => setView("landing")}
        />
      );

    default:
      return (
        <HeroSection
          onCreateAccount={() => navigate("/auth/register")}
          onLogin={() => navigate("/auth/login")}
        />
      );
  }
};

export default Index;
