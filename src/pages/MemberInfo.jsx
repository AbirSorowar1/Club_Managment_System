// MemberInfo.jsx - Updated with "Extra" Column in Table + CSV Support
// Shows extra amount paid only in the selected year

import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { useNavigate, useLocation } from "react-router-dom";

export default function MemberInfo() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = auth.currentUser;
    const [ownerName, setOwnerName] = useState("");
    const [members, setMembers] = useState({});
    const [darkMode, setDarkMode] = useState(true);
    const [filterSearch, setFilterSearch] = useState("");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }
        const ownerRef = ref(db, `owners/${user.uid}`);
        const unsubscribe = onValue(ownerRef, (snap) => {
            const data = snap.val();
            if (data) setOwnerName(data.name || "Admin");
            if (data && data.members) setMembers(data.members);
            else setMembers({});
        });
        return () => unsubscribe();
    }, [user, navigate]);

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    const handleLogout = () => { signOut(auth).then(() => navigate("/login")) };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Calculate monthly base amounts (200 Tk per covered month in the year)
    const getMonthlyBaseTotals = (payments, year) => {
        const monthly = Array(12).fill(0);
        if (!payments) return monthly;

        Object.values(payments).forEach(p => {
            const basePerMonth = Number(p.amountPerMonth || 200); // fallback to 200 if old data
            const numMonths = Number(p.numMonths || 0);
            if (numMonths <= 0) return;

            const startDate = new Date(`${p.startMonth}-01`);
            for (let i = 0; i < numMonths; i++) {
                const monthDate = new Date(startDate);
                monthDate.setMonth(startDate.getMonth() + i);
                if (monthDate.getFullYear() === year) {
                    const monthIdx = monthDate.getMonth();
                    monthly[monthIdx] += basePerMonth;
                }
            }
        });
        return monthly;
    };

    // Calculate total extra amount paid in the selected year
    const getYearlyExtraTotal = (payments, year) => {
        if (!payments) return 0;
        let extraTotal = 0;

        Object.values(payments).forEach(p => {
            const paymentDate = new Date(p.date);
            if (paymentDate.getFullYear() === year) {
                const extra = Number(p.extraAmount || 0);
                extraTotal += extra;
            }
        });

        return extraTotal;
    };

    // Total base + extra collected in selected year (for stats card)
    const getYearlyTotalCollected = () => {
        return Object.values(members).reduce((sum, mem) => {
            const monthlyBase = getMonthlyBaseTotals(mem.payments, selectedYear);
            const baseTotal = monthlyBase.reduce((a, b) => a + b, 0);
            const extraTotal = getYearlyExtraTotal(mem.payments, selectedYear);
            return sum + baseTotal + extraTotal;
        }, 0);
    };

    const filteredMembers = () => {
        if (!filterSearch) return Object.keys(members);
        return Object.keys(members).filter((key) =>
            members[key].name.toLowerCase().includes(filterSearch.toLowerCase())
        );
    };

    const isActive = (path) => location.pathname === path;

    // CSV Download with Extra column
    const downloadCSV = () => {
        let csv = "Member Name," + monthNames.join(",") + ",Extra (Tk),Total (Tk)\n";
        const sortedKeys = filteredMembers();
        sortedKeys.forEach(key => {
            const mem = members[key];
            const monthly = getMonthlyBaseTotals(mem.payments, selectedYear);
            const extra = getYearlyExtraTotal(mem.payments, selectedYear);
            const baseTotal = monthly.reduce((a, b) => a + b, 0);
            const total = baseTotal + extra;

            const row = [
                mem.name,
                ...monthly.map(amt => amt > 0 ? amt.toFixed(0) : ""),
                extra > 0 ? extra.toFixed(0) : "",
                total.toFixed(0)
            ];
            csv += row.join(",") + "\n";
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Independent_Club_Monthly_Report_${selectedYear}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Generate year options
    const currentYear = new Date().getFullYear();
    const yearOptions = [];
    for (let y = currentYear - 5; y <= currentYear + 2; y++) {
        yearOptions.push(y);
    }

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} transition-all duration-700`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-16">
                {/* Navigation */}
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
                            Hello, {ownerName || "Admin"}
                        </h1>
                        <p className="text-xl sm:text-2xl mt-6 opacity-80">
                            Monthly Payment Coverage for <span className="text-indigo-400 font-bold">Independent Club</span>
                        </p>
                        <p className="text-xl sm:text-2xl mt-4 opacity-80">
                            Total Collected (All Time): <span className="text-3xl sm:text-4xl font-bold text-emerald-400">
                                {Object.values(members).reduce((sum, mem) => {
                                    if (!mem.payments) return sum;
                                    return sum + Object.values(mem.payments).reduce((t, p) => t + Number(p.totalAmount || 0), 0);
                                }, 0).toLocaleString()} Tk
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

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
                    <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 text-center shadow-2xl">
                        <p className="text-lg opacity-70 mb-3">Total Members</p>
                        <p className="text-5xl font-extrabold">{Object.keys(members).length}</p>
                    </div>
                    <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 text-center shadow-2xl">
                        <p className="text-lg opacity-70 mb-3">Active in {selectedYear}</p>
                        <p className="text-5xl font-extrabold">
                            {Object.keys(members).filter(key => {
                                const monthly = getMonthlyBaseTotals(members[key].payments, selectedYear);
                                const extra = getYearlyExtraTotal(members[key].payments, selectedYear);
                                return monthly.some(amt => amt > 0) || extra > 0;
                            }).length}
                        </p>
                    </div>
                    <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 text-center shadow-2xl">
                        <p className="text-lg opacity-70 mb-3">Collected in {selectedYear}</p>
                        <p className="text-5xl font-extrabold text-emerald-400">
                            {getYearlyTotalCollected().toLocaleString()} Tk
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 shadow-2xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Monthly Payment Coverage - {selectedYear}</h2>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-gray-800/70 border border-gray-700 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:border-indigo-500 transition"
                        >
                            {yearOptions.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="🔍 Search members..."
                            className="bg-gray-800/70 border border-gray-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-indigo-500 transition placeholder-gray-500 w-full sm:w-64"
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                        />
                        <button
                            onClick={downloadCSV}
                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-2xl font-bold text-lg shadow-xl transition transform hover:scale-105"
                        >
                            📄 Download CSV
                        </button>
                    </div>
                </div>

                {/* Monthly Table with Extra Column */}
                <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl flex flex-col">
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
                            <table className="w-full min-w-[1400px]">
                                <thead className="bg-gray-800/50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-6 text-left text-sm font-semibold uppercase tracking-wider opacity-80">Name</th>
                                        {monthNames.map((month) => (
                                            <th key={month} className="px-6 py-6 text-center text-sm font-semibold uppercase tracking-wider opacity-80">{month}</th>
                                        ))}
                                        <th className="px-6 py-6 text-center text-sm font-semibold uppercase tracking-wider opacity-80 text-yellow-400">Extra</th>
                                        <th className="px-6 py-6 text-left text-sm font-semibold uppercase tracking-wider opacity-80">Total (Tk)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {filteredMembers().length === 0 ? (
                                        <tr>
                                            <td colSpan={monthNames.length + 3} className="py-20 text-center text-gray-500 text-xl">
                                                {filterSearch ? 'No members found' : 'No members yet'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredMembers().map((key) => {
                                            const mem = members[key];
                                            const monthly = getMonthlyBaseTotals(mem.payments, selectedYear);
                                            const extra = getYearlyExtraTotal(mem.payments, selectedYear);
                                            const baseTotal = monthly.reduce((a, b) => a + b, 0);
                                            const total = baseTotal + extra;

                                            return (
                                                <tr key={key} className="hover:bg-gray-800/40 transition">
                                                    <td className="px-6 py-6 font-semibold text-lg">{mem.name}</td>
                                                    {monthly.map((amt, idx) => (
                                                        <td key={idx} className="px-6 py-6 text-center font-bold text-xl text-emerald-400">
                                                            {amt > 0 ? `${amt.toFixed(0)} Tk` : '-'}
                                                        </td>
                                                    ))}
                                                    <td className="px-6 py-6 text-center font-bold text-xl text-yellow-300">
                                                        {extra > 0 ? `${extra.toFixed(0)} Tk` : '-'}
                                                    </td>
                                                    <td className="px-6 py-6 font-bold text-2xl text-emerald-400">{total.toFixed(0)} Tk</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}