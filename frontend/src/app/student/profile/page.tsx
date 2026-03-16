import React from "react";
import Layout from "../layout";
import StudentProfile from "../../../components/student/Profile";
import { useAuth } from "../../../contexts/AuthContext";
import { Navigate } from "react-router-dom";

const StudentProfilePage: React.FC = () => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/" replace />;
    
    return (
        <Layout>
            <StudentProfile />
        </Layout>
    );
};

export default StudentProfilePage;
