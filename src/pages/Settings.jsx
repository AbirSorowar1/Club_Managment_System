// Settings.jsx - Fully Updated: Modern UI + Responsive + Consistent with other pages
// App: Independent Club | Logo preserved | Full mobile support
import { useEffect, useState, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { ref, onValue, update } from "firebase/database";
import { useNavigate, useLocation } from "react-router-dom";
// Keep your logo import
import logo from "./Minimalist AS Latter Logo.png";

export default function Settings() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = auth.currentUser;
    const [ownerName, setOwnerName] = useState("");
    const [clubName, setClubName] = useState("Independent Club");
    const [monthlyFee, setMonthlyFee] = useState("");
    const [darkMode, setDarkMode] = useState(true);

    // Refs for Enter key support
    const nameRef = useRef(null);
    const clubRef = useRef(null);
    const feeRef = useRef(null);

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }
        const ownerRef = ref(db, `owners/${user.uid}`);
        const unsubscribe = onValue(ownerRef, (snap) => {
            const data = snap.val();
            if (data) {
                setOwnerName(data.name || "Admin");
                setClubName(data.clubName || "Independent Club");
                setMonthlyFee(data.monthlyFee || "");
            }
        });
        return () => unsubscribe();
    }, [user, navigate]);

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    const handleSave = async () => {
        if (!ownerName.trim() || !clubName.trim() || !monthlyFee || isNaN(monthlyFee) || Number(monthlyFee) <= 0) {
            alert("Please fill all fields with valid data!");
            return;
        }
        const ownerRef = ref(db, `owners/${user.uid}`);
        await update(ownerRef, {
            name: ownerName.trim(),
            clubName: clubName.trim(),
            monthlyFee: Number(monthlyFee)
        });
        alert("Settings saved successfully!");
    };

    const handleLogout = () => { signOut(auth).then(() => navigate("/login")) };

    const isActive = (path) => location.pathname === path;

    // Enter key navigation
    const handleNameKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            clubRef.current?.focus();
        }
    };
    const handleClubKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            feeRef.current?.focus();
        }
    };
    const handleFeeKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
        }
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} transition-all duration-700 relative`}>
            {/* Logo - Top Left */}
            <div className="absolute top-6 left-6 z-30 pointer-events-none">
                <div className="group relative">
                    <img
                        src={logo}
                        alt="Club Logo"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-2xl border-4 border-transparent transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-gray-500/60 group-hover:border-gray-400/60"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-600 opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500"></div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-16">
                {/* Navigation - Mobile Responsive */}
                <div className="mb-12 overflow-x-auto pb-4 -mx-4 px-4">
                    <div className="flex gap-4 justify-center min-w-max">
                        {[
                            { path: "/dashboard", label: "🏠 Dashboard", colors: "from-cyan-500 to-blue-600" },
                            { path: "/members", label: "👥 Members", colors: "from-emerald-500 to-green-600" },
                            { path: "/expenses", label: "💸 Expenses", colors: "from-orange-500 to-amber-600" },
                            { path: "/reports", label: "📊 Reports", colors: "from-purple-500 to-violet-600" },
                            { path: "/memberinfo", label: "📋 Member Info", colors: "from-indigo-500 to-purple-700" },
                            { path: "/settings", label: "⚙️ Settings", colors: "from-gray-600 to-gray-800" },
                        ].map(({ path, label, colors }) => (
                            <button
                                key={path}
                                onClick={() => navigate(path)}
                                className={`relative px-6 py-4 rounded-2xl overflow-hidden font-semibold text-base shadow-2xl transition-all duration-500 hover:scale-105 whitespace-nowrap flex-shrink-0
                                    ${isActive(path)
                                        ? `bg-gradient-to-br ${colors} text-white ring-4 ring-white/20 shadow-xl`
                                        : `bg-gray-800/70 text-gray-300 hover:bg-gray-700/80`}`}
                            >
                                <span className="relative z-10">{label}</span>
                                <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-500"></div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                            Club Settings
                        </h1>
                        <p className="text-xl sm:text-2xl mt-6 opacity-80">
                            Configure <span className="text-gray-400 font-bold">Independent Club</span>
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setDarkMode(!darkMode)} className="p-3 sm:p-4 rounded-2xl bg-gray-800/60 hover:bg-gray-700/80 transition shadow-lg text-2xl">
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                        <button onClick={handleLogout} className="px-6 sm:px-10 py-3 sm:py-4 rounded-2xl bg-red-600 hover:bg-red-700 font-semibold shadow-xl transition text-sm sm:text-base">
                            Logout
                        </button>
                    </div>
                </div>

                {/* Settings Form - Modern & Responsive */}
                <div className="max-w-2xl mx-auto">
                    <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 sm:p-12 shadow-2xl">
                        <h2 className="text-3xl font-bold mb-10 text-center sm:text-left">General Settings</h2>
                        <div className="space-y-8">
                            <div>
                                <label className="block text-xl font-semibold mb-3 opacity-90">Admin Name</label>
                                <input
                                    ref={nameRef}
                                    type="text"
                                    placeholder="Your name"
                                    className="w-full bg-gray-800/70 border border-gray-700 rounded-2xl px-8 py-6 text-xl focus:outline-none focus:border-gray-500 transition"
                                    value={ownerName}
                                    onChange={(e) => setOwnerName(e.target.value)}
                                    onKeyDown={handleNameKeyDown}
                                />
                            </div>
                            <div>
                                <label className="block text-xl font-semibold mb-3 opacity-90">Club Name</label>
                                <input
                                    ref={clubRef}
                                    type="text"
                                    placeholder="e.g., Independent Club"
                                    className="w-full bg-gray-800/70 border border-gray-700 rounded-2xl px-8 py-6 text-xl focus:outline-none focus:border-gray-500 transition"
                                    value={clubName}
                                    onChange={(e) => setClubName(e.target.value)}
                                    onKeyDown={handleClubKeyDown}
                                />
                            </div>
                            <div>
                                <label className="block text-xl font-semibold mb-3 opacity-90">Default Monthly Fee (Tk)</label>
                                <input
                                    ref={feeRef}
                                    type="number"
                                    placeholder="e.g., 1000"
                                    className="w-full bg-gray-800/70 border border-gray-700 rounded-2xl px-8 py-6 text-xl text-center font-bold focus:outline-none focus:border-gray-500 transition"
                                    value={monthlyFee}
                                    onChange={(e) => setMonthlyFee(e.target.value)}
                                    onKeyDown={handleFeeKeyDown}
                                />
                                <p className="text-sm opacity-70 mt-3 text-center">This is just for reference. Actual payments are recorded manually.</p>
                            </div>
                            <div className="pt-6">
                                <button
                                    onClick={handleSave}
                                    className="w-full py-6 bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 rounded-2xl font-bold text-2xl shadow-2xl transition transform hover:scale-105"
                                >
                                    💾 Save Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}