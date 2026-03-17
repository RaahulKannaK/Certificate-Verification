import React from "react";
import Layout from "../layout";
import InstitutionProfile from "../../../components/institution/Profile";
import { useAuth } from "../../../contexts/AuthContext";
import { Navigate } from "react-router-dom";

const InstitutionProfilePage: React.FC = () => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/" replace />;

    return (
        <Layout>
            <InstitutionProfile />
        </Layout>
    );
};

export default InstitutionProfilePage;
