// Dashboard.jsx - Updated: Proper scrolling for long Recent Payments & Expenses
// App: Independent Club
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { useNavigate, useLocation } from "react-router-dom";

export default function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = auth.currentUser;
    const [ownerName, setOwnerName] = useState("");
    const [members, setMembers] = useState({});
    const [expenses, setExpenses] = useState([]);
    const [darkMode, setDarkMode] = useState(true);
    const [totalCollected, setTotalCollected] = useState(0);
    const [totalSpent, setTotalSpent] = useState(0);
    const [clubBalance, setClubBalance] = useState(0);

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }
        const ownerRef = ref(db, `owners/${user.uid}`);
        const unsubscribe = onValue(ownerRef, (snap) => {
            const data = snap.val();
            let collected = 0;
            let spent = 0;
            if (data) {
                setOwnerName(data.name || "Admin");
                if (data.members) {
                    setMembers(data.members);
                    collected = Object.values(data.members).reduce((sum, mem) => {
                        const pays = mem.payments || {};
                        return sum + Object.values(pays).reduce((s, p) =>
                            s + (p.totalAmount || p.amount || 0), 0);
                    }, 0);
                    setTotalCollected(collected);
                } else {
                    setMembers({});
                }
                if (data.expenses) {
                    const expList = Object.values(data.expenses);
                    setExpenses(expList);
                    spent = expList.reduce((sum, exp) => sum + (exp.amount || 0), 0);
                    setTotalSpent(spent);
                } else {
                    setExpenses([]);
                }
            }
            setClubBalance(collected - spent);
        });
        return () => unsubscribe();
    }, [user, navigate]);

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    const handleLogout = () => {
        signOut(auth).then(() => navigate("/login"));
    };

    const isActive = (path) => location.pathname === path;

    const recentPayments = Object.entries(members)
        .flatMap(([key, mem]) =>
            (mem.payments ? Object.entries(mem.payments) : []).map(([pkey, p]) => ({
                memberName: key,
                ...p,
                id: pkey
            }))
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 20); // Increased limit a bit for more data visibility, but still controlled

    const recentExpenses = (expenses || [])
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 20); // Same for expenses

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} transition-all duration-700`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-16">
                {/* Navigation - Mobile Responsive (Horizontal Scroll with Visible Scrollbar) */}
                <div className="mb-12 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-visible">
                    <style jsx>{`
                        .scrollbar-visible::-webkit-scrollbar {
                            height: 10px;
                        }
                        .scrollbar-visible::-webkit-scrollbar-track {
                            background: #1e293b;
                            border-radius: 10px;
                        }
                        .scrollbar-visible::-webkit-scrollbar-thumb {
                            background: #4b5563;
                            border-radius: 10px;
                            border: 2px solid #1e293b;
                        }
                        .scrollbar-visible::-webkit-scrollbar-thumb:hover {
                            background: #6b7280;
                        }
                        .scrollbar-visible {
                            scrollbar-width: thin;
                            scrollbar-color: #4b5563 #1e293b;
                        }
                    `}</style>
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

                {/* Header - Responsive */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                            Hello, {ownerName || "Admin"}
                        </h1>
                        <p className="text-xl sm:text-2xl mt-6 opacity-80">
                            Welcome back to <span className="text-emerald-400 font-bold">Independent Club</span>
                        </p>
                        <p className="text-xl sm:text-2xl mt-4 opacity-80">
                            Total Collected:{" "}
                            <span className="text-3xl sm:text-4xl font-bold text-emerald-400">
                                {totalCollected.toLocaleString()} Tk
                            </span>
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

                {/* Stats Cards - Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {[
                        { label: "Total Members", value: Object.keys(members).length, color: "white" },
                        { label: "Total Collected", value: `${totalCollected.toLocaleString()} Tk`, color: "emerald" },
                        { label: "Total Spent", value: `${totalSpent.toLocaleString()} Tk`, color: "red" },
                        { label: "Club Balance", value: `${clubBalance.toLocaleString()} Tk`, color: clubBalance >= 0 ? "emerald" : "red" },
                    ].map((stat, i) => (
                        <div key={i} className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
                            <p className="text-base sm:text-lg opacity-70 mb-3">{stat.label}</p>
                            <p className={`text-4xl sm:text-5xl font-extrabold ${stat.color === 'emerald' ? 'text-emerald-400' : stat.color === 'red' ? 'text-red-400' : 'text-white'}`}>
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Recent Activity - Responsive Grid with Fixed Height Scrollable Areas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                    {/* Recent Payments - Scrollable with fixed max height */}
                    <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col">
                        <h3 className="text-2xl sm:text-3xl font-bold mb-6">Recent Payments</h3>
                        <div className="flex-1 overflow-y-auto scrollbar-visible max-h-96">
                            <style jsx>{`
                                .scrollbar-visible::-webkit-scrollbar {
                                    width: 10px;
                                }
                                .scrollbar-visible::-webkit-scrollbar-track {
                                    background: #1e293b;
                                    border-radius: 10px;
                                }
                                .scrollbar-visible::-webkit-scrollbar-thumb {
                                    background: #4b5563;
                                    border-radius: 10px;
                                    border: 2px solid #1e293b;
                                }
                                .scrollbar-visible::-webkit-scrollbar-thumb:hover {
                                    background: #6b7280;
                                }
                                .scrollbar-visible {
                                    scrollbar-width: thin;
                                    scrollbar-color: #4b5563 #1e293b;
                                }
                            `}</style>
                            <div className="space-y-4 pb-2">
                                {recentPayments.length === 0 ? (
                                    <p className="text-center text-gray-500 py-12 text-lg">No payments recorded yet</p>
                                ) : (
                                    recentPayments.map((p, i) => (
                                        <div key={i} className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                            <div>
                                                <p className="font-semibold text-base sm:text-lg">{p.memberName}</p>
                                                <p className="text-emerald-400 font-bold text-lg sm:text-xl">
                                                    {(p.totalAmount || p.amount).toLocaleString()} Tk
                                                    <span className="text-sm opacity-80 ml-2">
                                                        ({p.numMonths || 1} {p.numMonths > 1 ? 'months' : 'month'})
                                                    </span>
                                                </p>
                                            </div>
                                            <p className="text-sm opacity-70">
                                                {new Date(p.date).toLocaleDateString('en-GB')}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Expenses - Scrollable with fixed max height */}
                    <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col">
                        <h3 className="text-2xl sm:text-3xl font-bold mb-6">Recent Expenses</h3>
                        <div className="flex-1 overflow-y-auto scrollbar-visible max-h-96">
                            <style jsx>{`
                                .scrollbar-visible::-webkit-scrollbar {
                                    width: 10px;
                                }
                                .scrollbar-visible::-webkit-scrollbar-track {
                                    background: #1e293b;
                                    border-radius: 10px;
                                }
                                .scrollbar-visible::-webkit-scrollbar-thumb {
                                    background: #4b5563;
                                    border-radius: 10px;
                                    border: 2px solid #1e293b;
                                }
                                .scrollbar-visible::-webkit-scrollbar-thumb:hover {
                                    background: #6b7280;
                                }
                                .scrollbar-visible {
                                    scrollbar-width: thin;
                                    scrollbar-color: #4b5563 #1e293b;
                                }
                            `}</style>
                            <div className="space-y-4 pb-2">
                                {recentExpenses.length === 0 ? (
                                    <p className="text-center text-gray-500 py-12 text-lg">No expenses recorded yet</p>
                                ) : (
                                    recentExpenses.map((exp, i) => (
                                        <div key={i} className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                            <div>
                                                <p className="font-semibold text-base sm:text-lg">{exp.category}</p>
                                                <p className="text-red-400 font-bold text-lg sm:text-xl">
                                                    {exp.amount.toLocaleString()} Tk
                                                    {exp.description && <span className="text-sm opacity-80 ml-2">{exp.description}</span>}
                                                </p>
                                            </div>
                                            <p className="text-sm opacity-70">
                                                {new Date(exp.date).toLocaleDateString('en-GB')}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}