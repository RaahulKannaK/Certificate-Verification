import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Upload, User, Users, GitBranch } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

/* ================= TYPES ================= */
export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  issuerEmail: string;
  walletAddress: string;
  date: string;
  status: "pending" | "signed";
  type: string;
}

type SigningType = "self" | "sequential" | "parallel";

/* ================= PROPS ================= */
interface DigitalSignatureProps {
  onBack: () => void;
  onSign: (certificate: Certificate, signingType: SigningType) => void;
}

/* ================= COMPONENT ================= */
const DigitalSignature: React.FC<DigitalSignatureProps> = ({
  onBack,
  onSign,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] =
    useState<"all" | "pending" | "signed">("pending");
  const [signingType, setSigningType] = useState<SigningType>("self");

  /* ================= FETCH ISSUED CERTIFICATES ================= */
  useEffect(() => {
    if (!user?.walletPublicKey) return;

    const fetchCertificates = async () => {
      setLoading(true);
      try {
        console.log(
          "🔹 Fetching credentials for:",
          user.walletPublicKey
        );

        const res = await fetch(
          "http://localhost:5000/getIssuedCredentials",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              walletPublicKey: user.walletPublicKey,
            }),
          }
        );

        const data = await res.json();
        console.log("🔹 API response:", data);

        if (!data.success) {
          toast.error("Failed to fetch certificates");
          return;
        }

        const mapped: Certificate[] = data.data.map((c: any) => ({
          id: c.credentialId,
          name: c.title || "Untitled Certificate",
          issuer: "Institution",
          issuerEmail: "",
          walletAddress: c.studentPublicKey,
          date: new Date(c.issuedAt).toLocaleDateString(),
          status: c.status === "signed" ? "signed" : "pending",
          type: c.signingType || "self",
        }));

        setCertificates(mapped);
      } catch (err) {
        console.error("❌ Error fetching certificates:", err);
        toast.error("Error fetching certificates");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [user]);

  /* ================= FILTER ================= */
  const filteredCertificates = certificates.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.issuer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchTab = activeTab === "all" || c.status === activeTab;
    return matchSearch && matchTab;
  });

  /* ================= ACTIONS ================= */
  const handleFileSelect = () => fileInputRef.current?.click();

  const handleStartSigning = (certificate: Certificate) => {
    if (!user?.biometricSetup) {
      toast.error("Please complete biometric setup first");
      return;
    }

    if (certificate.status !== "pending") {
      toast.info("Certificate already signed");
      return;
    }

    onSign(certificate, signingType); // 🔥 IMPORTANT
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen relative z-10">
      {/* Background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(173_80%_40%/0.08),transparent_50%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(262_83%_58%/0.05),transparent_50%)]" />

      <div className="relative z-20 container mx-auto px-6 py-8 space-y-8 animate-fade-in">
        <Button variant="outline" onClick={onBack}>
          ← Back to Dashboard
        </Button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Digital Signature</h1>
            <p className="text-muted-foreground">
              Blockchain-based certificate signing
            </p>
          </div>

          <div>
            <input ref={fileInputRef} type="file" hidden />
            <Button variant="hero" onClick={handleFileSelect} className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Certificate
            </Button>
          </div>
        </div>

        {/* Signing Mode */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
          ].map(({ type, icon: Icon, label }) => (
            <Card
              key={type}
              onClick={() => setSigningType(type as SigningType)}
              className={`cursor-pointer ${
                signingType === type
                  ? "border-2 border-primary"
                  : ""
              }`}
            >
              <CardContent className="p-4 flex gap-4 items-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{label}</h3>
                  <p className="text-xs text-muted-foreground">
                    Blockchain signing
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Certificates */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>Your Certificates</CardTitle>
                <CardDescription>
                  Issued credentials waiting for signature
                </CardDescription>
              </div>

              <div className="relative sm:w-64">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search certificates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="signed">Signed</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4 space-y-4">
                {loading ? (
                  <p className="text-center text-muted-foreground">
                    Loading certificates...
                  </p>
                ) : filteredCertificates.length === 0 ? (
                  <p className="text-center text-muted-foreground">
                    No certificates found
                  </p>
                ) : (
                  filteredCertificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex justify-between items-center p-4 rounded-xl border"
                    >
                      <div>
                        <h3 className="font-semibold">{cert.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Issued on {cert.date}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant={
                          cert.status === "pending"
                            ? "hero"
                            : "secondary"
                        }
                        onClick={() =>
                          cert.status === "pending"
                            ? handleStartSigning(cert)
                            : toast.info("Verification coming soon")
                        }
                      >
                        {cert.status === "pending" ? "Sign" : "Signed"}
                      </Button>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DigitalSignature;
