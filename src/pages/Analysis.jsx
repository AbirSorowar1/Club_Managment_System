// Analysis.jsx - Fixed with react-chartjs-2 (Charts now properly render)
// Fully responsive + Matches your app design
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";

// 🔥 Import from react-chartjs-2
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function Analysis() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = auth.currentUser;

    const [ownerName, setOwnerName] = useState("");
    const [members, setMembers] = useState({});
    const [expenses, setExpenses] = useState([]);
    const [darkMode, setDarkMode] = useState(true);
    const [monthlyData, setMonthlyData] = useState([]);

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
                setMembers(data.members || {});

                if (data.expenses) {
                    const expList = Object.entries(data.expenses)
                        .map(([key, value]) => ({ id: key, ...value }))
                        .sort((a, b) => new Date(b.date) - new Date(a.date));
                    setExpenses(expList);
                } else {
                    setExpenses([]);
                }
            }
        });

        return () => unsubscribe();
    }, [user, navigate]);

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    // Process monthly data
    useEffect(() => {
        const monthlyMap = {};

        // Process member payments
        Object.values(members).forEach(mem => {
            if (mem.payments) {
                Object.values(mem.payments).forEach(pay => {
                    const date = new Date(pay.date);
                    const monthKey = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

                    if (!monthlyMap[monthKey]) {
                        monthlyMap[monthKey] = { collection: 0, expense: 0, month: monthKey };
                    }

                    const total = Number(pay.totalAmount || (pay.amountPerMonth * pay.numMonths) || (pay.amount * pay.numMonths));
                    monthlyMap[monthKey].collection += total;
                });
            }
        });

        // Process expenses
        expenses.forEach(exp => {
            const date = new Date(exp.date);
            const monthKey = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

            if (!monthlyMap[monthKey]) {
                monthlyMap[monthKey] = { collection: 0, expense: 0, month: monthKey };
            }

            monthlyMap[monthKey].expense += Number(exp.amount || 0);
        });

        // Sort by date
        const sortedData = Object.values(monthlyMap)
            .sort((a, b) => new Date('01 ' + a.month) - new Date('01 ' + b.month));

        setMonthlyData(sortedData);
    }, [members, expenses]);

    const totalCollection = monthlyData.reduce((sum, m) => sum + m.collection, 0);
    const totalExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0);
    const netBalance = totalCollection - totalExpense;

    const handleLogout = () => signOut(auth).then(() => navigate("/login"));

    const isActive = (path) => location.pathname === path;

    // Chart common options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: false }
        }
    };

    // Data for charts
    const labels = monthlyData.map(m => m.month);

    const lineData = {
        labels,
        datasets: [
            {
                label: 'Collection',
                data: monthlyData.map(m => m.collection),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Expense',
                data: monthlyData.map(m => m.expense),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const barData = {
        labels,
        datasets: [{
            label: 'Net Profit/Loss',
            data: monthlyData.map(m => m.collection - m.expense),
            backgroundColor: monthlyData.map(m => (m.collection - m.expense >= 0 ? '#10b981' : '#ef4444'))
        }]
    };

    const doughnutData = {
        labels: ['Total Collection', 'Total Expenses'],
        datasets: [{
            data: [totalCollection, totalExpense],
            backgroundColor: ['#10b981', '#ef4444'],
            borderWidth: 0
        }]
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} transition-all duration-700`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-16">
                {/* Navigation (same as before) */}
                <div className="mb-12 overflow-x-auto pb-4 -mx-4 px-4">
                    <div className="flex gap-4 justify-center min-w-max">
                        {[
                            { path: "/dashboard", label: "🏠 Dashboard", colors: "from-cyan-500 to-blue-600" },
                            { path: "/members", label: "👥 Members", colors: "from-emerald-500 to-green-600" },
                            { path: "/expenses", label: "💸 Expenses", colors: "from-orange-500 to-amber-600" },
                            { path: "/analysis", label: "📈 Analysis", colors: "from-pink-500 to-rose-600" },
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

                {/* Header & Summary Cards (same as before) */}
                {/* ... (previous code unchanged) ... */}

                {/* Charts - Now using react-chartjs-2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                    {/* Line Chart */}
                    <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-6 text-center">Monthly Trend</h3>
                        <div className="h-80">
                            <Line options={chartOptions} data={lineData} />
                        </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-6 text-center">Monthly Profit/Loss</h3>
                        <div className="h-80">
                            <Bar options={chartOptions} data={barData} />
                        </div>
                    </div>
                </div>

                {/* Doughnut + Table */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Doughnut Chart */}
                    <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 sm:p-10 shadow-2xl lg:col-span-1">
                        <h3 className="text-2xl font-bold mb-6 text-center">Overall Split</h3>
                        <div className="h-80 flex items-center justify-center">
                            <Doughnut options={chartOptions} data={doughnutData} />
                        </div>
                    </div>

                    {/* Monthly Table (same as before) */}
                    {/* ... */}
                </div>
            </div>
        </div>
    );
}