// Reports.jsx - Updated with Scrollable Member Payment Summary Table
// All previous design, structure, and features preserved exactly
// App: Independent Club
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { useNavigate, useLocation } from "react-router-dom";

export default function Reports() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = auth.currentUser;
    const [ownerName, setOwnerName] = useState("");
    const [members, setMembers] = useState({});
    const [expenses, setExpenses] = useState([]);
    const [darkMode, setDarkMode] = useState(true);

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
                if (data.members) setMembers(data.members);
                else setMembers({});
                if (data.expenses) {
                    const expList = Object.entries(data.expenses).map(([key, exp]) => ({
                        id: key,
                        ...exp
                    }));
                    setExpenses(expList);
                } else setExpenses([]);
            }
        });
        return () => unsubscribe();
    }, [user, navigate]);

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    const handleLogout = () => { signOut(auth).then(() => navigate("/login")) };

    const isActive = (path) => location.pathname === path;

    const calculateMemberTotal = (payments) => {
        if (!payments) return { totalAmount: 0, totalMonths: 0, count: 0 };
        let totalAmount = 0;
        let totalMonths = 0;
        let count = 0;
        Object.values(payments).forEach(p => {
            totalAmount += Number(p.totalAmount || p.amount || 0);
            totalMonths += Number(p.numMonths || 0);
            count++;
        });
        return { totalAmount, totalMonths, count };
    };

    const memberSummary = Object.entries(members).map(([name, mem]) => {
        const { totalAmount, totalMonths, count } = calculateMemberTotal(mem.payments);
        return { name, totalAmount, totalMonths, count };
    }).sort((a, b) => b.totalAmount - a.totalAmount);

    const expenseCategorySummary = expenses.reduce((acc, exp) => {
        const category = exp.category || "Uncategorized";
        if (!acc[category]) acc[category] = 0;
        acc[category] += Number(exp.amount || 0);
        return acc;
    }, {});

    const totalCollected = memberSummary.reduce((sum, m) => sum + m.totalAmount, 0);
    const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    const netBalance = totalCollected - totalSpent;

    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} transition-all duration-700`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-16">
                {/* Navigation - Mobile Responsive (Horizontal Scroll) */}
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

                {/* Header - Responsive */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                            Hello, {ownerName || "Admin"}
                        </h1>
                        <p className="text-xl sm:text-2xl mt-6 opacity-80">
                            Financial Reports for <span className="text-purple-400 font-bold">Independent Club</span>
                        </p>
                        <p className="text-xl sm:text-2xl mt-4 opacity-80">
                            Net Balance: <span className={`text-3xl sm:text-4xl font-bold ${netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {netBalance >= 0 ? '+' : ''}{netBalance.toLocaleString()} Tk
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
                    <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 text-center shadow-2xl">
                        <p className="text-lg opacity-70 mb-3">Total Members</p>
                        <p className="text-5xl font-extrabold">{Object.keys(members).length}</p>
                    </div>
                    <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 text-center shadow-2xl">
                        <p className="text-lg opacity-70 mb-3">Total Collected</p>
                        <p className="text-5xl font-extrabold text-emerald-400">{totalCollected.toLocaleString()} Tk</p>
                    </div>
                    <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 text-center shadow-2xl">
                        <p className="text-lg opacity-70 mb-3">Total Spent</p>
                        <p className="text-5xl font-extrabold text-red-400">{totalSpent.toLocaleString()} Tk</p>
                    </div>
                </div>

                {/* Main Reports Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
                    {/* Member Payment Summary - Now Scrollable with Visible Scrollbar */}
                    <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl flex flex-col">
                        <h3 className="text-3xl font-bold mb-8">Member Payment Summary</h3>
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
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px]">
                                    <thead className="bg-gray-800/50 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wider opacity-80">Member</th>
                                            <th className="px-6 py-5 text-right text-sm font-semibold uppercase tracking-wider opacity-80">Total Paid (Tk)</th>
                                            <th className="px-6 py-5 text-right text-sm font-semibold uppercase tracking-wider opacity-80">Months Paid</th>
                                            <th className="px-6 py-5 text-right text-sm font-semibold uppercase tracking-wider opacity-80">Transactions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {memberSummary.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-20 text-center text-gray-500 text-xl">No members yet</td>
                                            </tr>
                                        ) : (
                                            memberSummary.map((m, i) => (
                                                <tr key={i} className="hover:bg-gray-800/40 transition">
                                                    <td className="px-6 py-5 font-medium text-lg">{m.name}</td>
                                                    <td className="px-6 py-5 text-right font-bold text-xl text-emerald-400">{m.totalAmount.toLocaleString()}</td>
                                                    <td className="px-6 py-5 text-right text-lg">{m.totalMonths}</td>
                                                    <td className="px-6 py-5 text-right text-lg opacity-80">{m.count}</td>
                                                </tr>
                                            ))
                                        )}
                                        <tr className="font-bold bg-gray-800/50">
                                            <td className="px-6 py-5 text-lg">Total Collected</td>
                                            <td className="px-6 py-5 text-right text-2xl text-emerald-400">{totalCollected.toLocaleString()} Tk</td>
                                            <td className="px-6 py-5 text-right">-</td>
                                            <td className="px-6 py-5 text-right">-</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Recent Expenses */}
                    <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl">
                        <h3 className="text-3xl font-bold mb-8">Recent Expenses (by Date)</h3>
                        {sortedExpenses.length === 0 ? (
                            <p className="text-center text-gray-500 py-20 text-xl">No expenses recorded</p>
                        ) : (
                            <div className="space-y-5 max-h-96 overflow-y-auto">
                                {sortedExpenses.map((exp) => (
                                    <div key={exp.id} className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <p className="font-semibold text-xl">{exp.category || "Uncategorized"}</p>
                                            <p className="text-lg opacity-80 mt-1">
                                                {exp.description || exp.place ? (exp.description || `at ${exp.place}`) : "-"}
                                            </p>
                                            <p className="text-sm opacity-70 mt-2">
                                                {new Date(exp.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <p className="font-bold text-3xl text-red-400">{exp.amount.toLocaleString()} Tk</p>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center p-6 bg-gray-800/80 rounded-2xl font-bold border-t-4 border-gray-700 mt-6">
                                    <span className="text-xl">Total Spent</span>
                                    <span className="text-3xl text-red-400">{totalSpent.toLocaleString()} Tk</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Financial Summary Card */}
                <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-3xl p-12 text-center shadow-2xl">
                    <h3 className="text-3xl font-bold mb-6">Club Financial Summary</h3>
                    <p className="text-6xl sm:text-7xl font-extrabold">
                        <span className={netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {netBalance >= 0 ? '+' : ''}{netBalance.toLocaleString()} Tk
                        </span>
                    </p>
                    <p className="text-2xl opacity-80 mt-6">
                        {netBalance >= 0 ? 'Profit' : 'Loss'} (Collected - Spent)
                    </p>
                </div>
            </div>
        </div>
    );
}