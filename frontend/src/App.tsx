import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import StudentDashboardPage from "./app/student/dashboard/page";
import StudentVerificationPage from "./app/student/verification/page";
import StudentProfilePage from "./app/student/profile/page";
import InstitutionDashboardPage from "./app/institution/dashboard/page";
import InstitutionVerificationPage from "./app/institution/verification/page";
import InstitutionProfilePage from "./app/institution/profile/page";
import LoginPage from "./app/auth/login/page";
import RegisterPage from "./app/auth/register/page";
import VerifyCredential from "./pages/VerifyCredential";
import { SigningView } from "./components/signing/SigningView"; // Import SigningView
import "./App.css";

const queryClient = new QueryClient();

/** Redirect /student → /student/dashboard if logged in, else → / (login) */
const StudentRedirect = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/student/dashboard" replace /> : <Navigate to="/" replace />;
};

// Wrapper for SigningView to handle params
const SigningViewWrapper = () => {
  const { credentialId } = useParams();
  const navigate = useNavigate();
  
  return (
    <SigningView 
      credentialId={credentialId || ""} 
      onBack={() => navigate(-1)} 
    />
  );
};

const AppContent = () => {
  useEffect(() => {
    console.log("API URL:", import.meta.env.VITE_API_URL);
  }, []);

  return (
    <TooltipProvider>
      <div className="app-container">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/student" element={<StudentRedirect />} />
            <Route path="/student/dashboard" element={<StudentDashboardPage />} />
            <Route path="/institution/dashboard" element={<InstitutionDashboardPage />} />
            <Route path="/institution/verification" element={<InstitutionVerificationPage />} />
            <Route path="/institution/profile" element={<InstitutionProfilePage />} />
            <Route path="/student/verification" element={<StudentVerificationPage />} />
            <Route path="/student/profile" element={<StudentProfilePage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/institution/verify" element={<Index />} />
            
            {/* ADD THIS ROUTE for SigningView */}
            <Route path="/sign/:credentialId" element={<SigningViewWrapper />} />
            
            <Route path="/verify/:credentialId" element={<VerifyCredential />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </QueryClientProvider>
);

export default App;