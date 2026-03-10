import React, { useState } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { CreateAccountForm } from "@/components/auth/CreateAccountForm";
import { LoginForm } from "@/components/auth/LoginForm";
import DigitalSignature from "@/components/dashboard/DigitalSignature";
import SignCertificate from "@/pages/SignCertificate";
import { useAuth } from "@/contexts/AuthContext";

import StudentPage from "@/app/student/page";
import InstitutionPage from "@/app/institution/page";

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

  /* 🔹 AUTO-REDIRECT ON AUTH CHANGE */
  React.useEffect(() => {
    if (!user && view !== "landing" && view !== "login" && view !== "create") {
      setView("landing");
    } else if (user && view === "landing") {
      setView("dashboard");
    }
  }, [user, view]);

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
      if (user?.role === "institution") {
        return <InstitutionPage onHome={() => setView("landing")} />;
      }
      return <StudentPage onHome={() => setView("landing")} />;

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
