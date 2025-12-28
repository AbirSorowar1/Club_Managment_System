// Dashboard.jsx - Fixed Dark Mode Only (No Toggle Button) + Super Cool Recent Payments

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

    const [totalBaseCollected, setTotalBaseCollected] = useState(0);
    const [totalExtraCollected, setTotalExtraCollected] = useState(0);
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
            let baseCollected = 0;
            let extraCollected = 0;
            let totalCollectedAmt = 0;
            let spent = 0;

            if (data) {
                setOwnerName(data.name || "Admin");

                if (data.members) {
                    setMembers(data.members);
                    Object.values(data.members).forEach(mem => {
                        const pays = mem.payments || {};
                        Object.values(pays).forEach(p => {
                            const totalAmt = Number(p.totalAmount || p.amount || 0);
                            const extraAmt = Number(p.extraAmount || 0);
                            const baseAmt = totalAmt - extraAmt;

                            baseCollected += baseAmt;
                            extraCollected += extraAmt;
                            totalCollectedAmt += totalAmt;
                        });
                    });
                } else {
                    setMembers({});
                }

                setTotalBaseCollected(baseCollected);
                setTotalExtraCollected(extraCollected);
                setTotalCollected(totalCollectedAmt);

                if (data.expenses) {
                    const expList = Object.entries(data.expenses).map(([key, val]) => ({ id: key, ...val }));
                    setExpenses(expList);
                    spent = expList.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
                    setTotalSpent(spent);
                } else {
                    setExpenses([]);
                }
            }

            setClubBalance(totalCollectedAmt - spent);
        });

        return () => unsubscribe();
    }, [user, navigate]);

    // Force Dark Mode Always (No Toggle)
    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    const handleLogout = () => {
        signOut(auth).then(() => navigate("/login"));
    };

    const isActive = (path) => location.pathname === path;

    const recentPayments = Object.entries(members)
        .flatMap(([memberKey, mem]) =>
            (mem.payments ? Object.entries(mem.payments) : []).map(([pkey, p]) => ({
                memberName: memberKey,
                ...p,
                id: pkey
            }))
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 20);

    const recentExpenses = (expenses || [])
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 20);

    return (
        <div className="min-h-screen bg-gray-950 text-white"> {/* Fixed Dark Background */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-16">
                {/* Navigation */}
                <div className="mb-12 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-visible">
                    <style jsx>{`
                        .scrollbar-visible::-webkit-scrollbar { height: 10px; }
                        .scrollbar-visible::-webkit-scrollbar-track { background: #1e293b; border-radius: 10px; }
                        .scrollbar-visible::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 10px; }
                        .scrollbar-visible { scrollbar-width: thin; scrollbar-color: #4b5563 #1e293b; }
                    `}</style>
                    <div className="flex gap-4 justify-center min-w-max">
                        {[
                            { path: "/dashboard", label: "🏠 Dashboard", colors: "from-cyan-500 to-blue-600" },
                            { path: "/members", label: "👥 Members", colors: "from-emerald-500 to-green-600" },
                            { path: "/expenses", label: "💸 Expenses", colors: "from-orange-500 to-amber-600" },
                            { path: "/reports", label: "📊 Reports", colors: "from-purple-500 to-violet-600" },
                            { path: "/memberinfo", label: "📋 Member Info", colors: "from-indigo-500 to-purple-700" },
                            { path: "/settings", label: "⚙️ Settings", colors: "from-gray-600 to-gray-800" },
                            { path: "/analysis", label: "📈 Analysis", colors: "from-pink-500 to-rose-600" },
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

                {/* Header - Only Logout Button Now */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                            Hello, {ownerName || "Admin"}
                        </h1>
                        <p className="text-xl sm:text-2xl mt-6 opacity-80">
                            Welcome back to <span className="text-emerald-400 font-bold">Independent Club</span>
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {/* 🌙☀️ Toggle Button Removed */}
                        <button onClick={handleLogout} className="px-6 sm:px-10 py-3 sm:py-4 rounded-2xl bg-red-600 hover:bg-red-700 font-semibold shadow-xl transition text-sm sm:text-base">
                            Logout
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
                    {[
                        { label: "Total Members", value: Object.keys(members).length, color: "white" },
                        { label: "Base Collected", value: `${totalBaseCollected.toLocaleString()} Tk`, color: "emerald", subtitle: "Monthly fees (200 Tk)" },
                        { label: "Extra Collected", value: `${totalExtraCollected.toLocaleString()} Tk`, color: "yellow", subtitle: "Donations" },
                        { label: "Total Spent", value: `${totalSpent.toLocaleString()} Tk`, color: "red", subtitle: "All expenses" },
                        { label: "Club Balance", value: `${clubBalance.toLocaleString()} Tk`, color: clubBalance >= 0 ? "emerald" : "red", subtitle: `${totalCollected.toLocaleString()} - ${totalSpent.toLocaleString()} Tk` },
                    ].map((stat, i) => (
                        <div key={i} className={`bg-gray-900/60 backdrop-blur-xl border ${stat.color === 'red' ? 'border-red-800/50' : stat.color === 'emerald' ? 'border-emerald-800/50' : stat.color === 'yellow' ? 'border-yellow-800/50' : 'border-gray-800'} rounded-3xl p-6 text-center shadow-2xl transition-all hover:scale-105`}>
                            <p className="text-base opacity-70 mb-1">{stat.label}</p>
                            {stat.subtitle && <p className="text-xs opacity-50 mb-3">{stat.subtitle}</p>}
                            <p className={`text-3xl sm:text-4xl font-extrabold ${stat.color === 'emerald' ? 'text-emerald-400' : stat.color === 'yellow' ? 'text-yellow-300' : stat.color === 'red' ? 'text-red-400' : 'text-white'}`}>
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                    {/* 🔥 Super Cool Recent Payments Box 🔥 */}
                    <div className="relative bg-gradient-to-br from-emerald-900/40 via-gray-900/80 to-green-900/40 backdrop-blur-xl border border-emerald-500/50 rounded-3xl p-8 shadow-2xl ring-2 ring-emerald-500/20 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/20 to-transparent blur-3xl animate-pulse"></div>

                        <h3 className="relative text-3xl sm:text-4xl font-extrabold mb-8 text-center bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                            💰 Recent Payments
                        </h3>

                        <div className="flex-1 overflow-y-auto scrollbar-visible max-h-96 pr-2">
                            <style jsx>{`
                                .scrollbar-visible::-webkit-scrollbar { width: 8px; }
                                .scrollbar-visible::-webkit-scrollbar-track { background: rgba(16, 185, 129, 0.1); border-radius: 10px; }
                                .scrollbar-visible::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
                                .scrollbar-visible::-webkit-scrollbar-thumb:hover { background: #059669; }
                                .scrollbar-visible { scrollbar-width: thin; scrollbar-color: #10b981 rgba(16, 185, 129, 0.1); }
                            `}</style>

                            <div className="space-y-5 pb-4">
                                {recentPayments.length === 0 ? (
                                    <p className="text-center text-gray-400 py-16 text-xl font-medium">No payments recorded yet</p>
                                ) : (
                                    recentPayments.map((p, i) => {
                                        const extra = Number(p.extraAmount || 0);
                                        const base = (p.totalAmount || p.amount || 0) - extra;

                                        return (
                                            <div
                                                key={i}
                                                className="group relative bg-gradient-to-r from-gray-800/70 to-gray-900/70 backdrop-blur-md border border-emerald-700/50 rounded-2xl p-6 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/30 hover:border-emerald-400"
                                            >
                                                <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold shadow-lg">
                                                                {p.memberName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <p className="font-bold text-lg text-white">{p.memberName}</p>
                                                        </div>

                                                        {base > 0 && (
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="px-3 py-1 rounded-full bg-emerald-600/30 text-emerald-300 text-sm font-semibold">Regular</span>
                                                                <p className="text-2xl font-extrabold text-emerald-400">
                                                                    {base.toLocaleString()} Tk
                                                                </p>
                                                                <span className="text-sm opacity-80 text-gray-300">
                                                                    ({p.numMonths || 1} {p.numMonths > 1 ? 'months' : 'month'})
                                                                </span>
                                                            </div>
                                                        )}

                                                        {extra > 0 && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="px-3 py-1 rounded-full bg-yellow-600/30 text-yellow-300 text-sm font-semibold">Extra</span>
                                                                <p className="text-2xl font-extrabold text-yellow-300">
                                                                    + {extra.toLocaleString()} Tk
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="text-right">
                                                        <p className="text-xs opacity-60 mb-1">Date</p>
                                                        <p className="text-sm font-medium text-gray-300">
                                                            {new Date(p.date).toLocaleDateString('en-GB')}
                                                        </p>
                                                        <p className="text-lg font-bold text-white mt-3">
                                                            Total: {(base + extra).toLocaleString()} Tk
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Expenses */}
                    <div className="bg-gray-900/70 backdrop-blur-xl border border-red-800/50 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col ring-2 ring-red-800/30">
                        <h3 className="text-2xl sm:text-3xl font-bold mb-6 text-red-400">Recent Expenses</h3>
                        <div className="flex-1 overflow-y-auto scrollbar-visible max-h-96">
                            <style jsx>{`
                                .scrollbar-visible::-webkit-scrollbar { width: 10px; }
                                .scrollbar-visible::-webkit-scrollbar-track { background: #1e293b; border-radius: 10px; }
                                .scrollbar-visible::-webkit-scrollbar-thumb { background: #ef4444; border-radius: 10px; border: 2px solid #1e293b; }
                            `}</style>
                            <div className="space-y-4 pb-2">
                                {recentExpenses.length === 0 ? (
                                    <p className="text-center text-gray-500 py-12 text-lg">No expenses recorded yet</p>
                                ) : (
                                    recentExpenses.map((exp, i) => (
                                        <div key={i} className="bg-red-900/30 backdrop-blur border border-red-700/50 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                            <div>
                                                <p className="font-semibold text-base sm:text-lg text-red-300">{exp.category || "Expense"}</p>
                                                <p className="text-red-400 font-bold text-xl sm:text-2xl">
                                                    {Number(exp.amount || 0).toLocaleString()} Tk
                                                </p>
                                                {exp.description && (
                                                    <p className="text-sm opacity-80 mt-1 text-red-200">→ {exp.description}</p>
                                                )}
                                            </div>
                                            <p className="text-sm opacity-70 text-right">
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