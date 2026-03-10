import React, { useEffect } from "react";
import { Navbar } from "../../components/layout/Navbar";

interface LayoutProps {
    children: React.ReactNode;
    onHome?: () => void;
}

const Layout: React.FC<LayoutProps> = ({
    children,
    onHome
}) => {

    return (
        <div className="h-screen overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', backgroundColor: '#eeedf9' }}>
            <Navbar isLanding={false} onHome={onHome} />

            {/* ── MAIN CONTENT ── */}
            <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '120px 24px 80px' }}>
                {children}
            </div>
        </div>
    );
};

export default Layout;
