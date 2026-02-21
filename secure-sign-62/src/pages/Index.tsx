import React, { useState } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { CreateAccountForm } from "@/components/auth/CreateAccountForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { Dashboard } from "@/components/dashboard/Dashboard";
import DigitalSignature from "@/components/dashboard/DigitalSignature";
import SignCertificate from "@/pages/SignCertificate";
import { useAuth } from "@/contexts/AuthContext";

/* 🔹 ADD NEW VIEWS HERE */
type View =
  | "landing"
  | "create"
  | "login"
  | "dashboard"
  | "digital-signature"
  | "sign-certificate";

const Index: React.FC = () => {
  const { user } = useAuth();

  const [view, setView] = useState<View>(user ? "dashboard" : "landing");

  /* 🔹 HOLD SIGNING DATA */
  const [selectedCredentialId, setSelectedCredentialId] = useState<string | null>(null);
  const [signingType, setSigningType] = useState<"self" | "sequential" | "parallel">("self");

  /* 🔹 IF USER LOGGED IN, FORCE DASHBOARD */
  if (user && view === "landing") {
    setView("dashboard");
  }

  switch (view) {
    case "create":
      return (
        <CreateAccountForm
          onBack={() => setView("landing")}
          onSuccess={() => setView("login")}
        />
      );

    case "login":
      return (
        <LoginForm
          onBack={() => setView("landing")}
          onSuccess={() => setView("dashboard")}
        />
      );

    case "dashboard":
      return (
        <Dashboard
          onNavigate={(next: string) => {
            if (next === "digital-signature") {
              setView("digital-signature");
            }
          }}
        />
      );

    case "digital-signature":
      return (
        <DigitalSignature
          onBack={() => setView("dashboard")}
          onSign={(certificate, type) => {
            // 🔹 PASS ONLY credentialId to SignCertificate
            setSelectedCredentialId(certificate.id);
            setSigningType(type);
            setView("sign-certificate");
          }}
        />
      );

    case "sign-certificate":
      if (!selectedCredentialId) {
        // safeguard
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <p className="text-red-500">No certificate selected.</p>
            <button onClick={() => setView("digital-signature")}>Go Back</button>
          </div>
        );
      }

      return (
        <SignCertificate
          credentialId={selectedCredentialId}
          signingType={signingType} // optional if your SignCertificate uses it
          onBack={() => setView("digital-signature")}
        />
      );

    default:
      return (
        <HeroSection
          onCreateAccount={() => setView("create")}
          onLogin={() => setView("login")}
        />
      );
  }
};

export default Index;
