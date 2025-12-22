// Expenses.jsx - Updated with Enter Key Support + Full Mobile Responsiveness
// All previous design preserved | App: Independent Club
import { useEffect, useState, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { ref, onValue, push, set, update, remove } from "firebase/database";
import { useNavigate, useLocation } from "react-router-dom";

export default function Expenses() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = auth.currentUser;
    const [ownerName, setOwnerName] = useState("");
    const [expenses, setExpenses] = useState([]);
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [darkMode, setDarkMode] = useState(true);
    const [editExpense, setEditExpense] = useState(null);
    const [editCategory, setEditCategory] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editAmount, setEditAmount] = useState("");

    // Refs for Enter key focus navigation
    const categoryRef = useRef(null);
    const descriptionRef = useRef(null);
    const amountRef = useRef(null);

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

    const handleLogout = () => { signOut(auth).then(() => navigate("/login")) };

    const handleAddExpense = async () => {
        if (!category.trim() || !description.trim() || !amount || isNaN(amount) || Number(amount) <= 0) {
            alert("Please enter valid category, description, and amount!");
            return;
        }
        const expRef = ref(db, `owners/${user.uid}/expenses`);
        const newExp = push(expRef);
        await set(newExp, {
            category: category.trim(),
            description: description.trim(),
            amount: Number(amount),
            date: new Date().toISOString()
        });
        setCategory("");
        setDescription("");
        setAmount("");
        categoryRef.current?.focus(); // Focus back to first field after submit
    };

    const handleEditExpense = (id, exp) => {
        setEditExpense(id);
        setEditCategory(exp.category);
        setEditDescription(exp.description || "");
        setEditAmount(exp.amount);
    };

    const saveEditExpense = async () => {
        if (!editExpense) return;
        const expRef = ref(db, `owners/${user.uid}/expenses/${editExpense}`);
        await update(expRef, {
            category: editCategory.trim(),
            description: editDescription.trim(),
            amount: Number(editAmount)
        });
        setEditExpense(null);
    };

    const deleteExpense = async (id) => {
        if (!confirm("Are you sure you want to delete this expense?")) return;
        const expRef = ref(db, `owners/${user.uid}/expenses/${id}`);
        await remove(expRef);
    };

    const calculateTotalExpenses = () => {
        return expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    };

    const filteredExpenses = () => {
        let filtered = [...expenses];
        if (filterDate) filtered = filtered.filter(exp => exp.date.startsWith(filterDate));
        let running = 0;
        return filtered.map(exp => {
            running += Number(exp.amount || 0);
            return { ...exp, runningTotal: running };
        });
    };

    const isActive = (path) => location.pathname === path;

    // Enter key handlers
    const handleCategoryKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            descriptionRef.current?.focus();
        }
    };

    const handleDescriptionKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            amountRef.current?.focus();
        }
    };

    const handleAmountKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddExpense();
        }
    };

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
                            Manage expenses for <span className="text-orange-400 font-bold">Independent Club</span>
                        </p>
                        <p className="text-xl sm:text-2xl mt-4 opacity-80">
                            Total Spent:{" "}
                            <span className="text-3xl sm:text-4xl font-bold text-red-400">
                                {calculateTotalExpenses().toLocaleString()} Tk
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

                {/* Add Expense Form - Responsive + Enter Support */}
                <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 sm:p-10 shadow-2xl mb-16">
                    <h3 className="text-2xl sm:text-3xl font-bold mb-8 text-center sm:text-left">Record New Expense</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <input
                            ref={categoryRef}
                            type="text"
                            placeholder="Category (e.g., Rent, Electricity)"
                            className="bg-gray-800/70 border border-gray-700 rounded-2xl px-6 py-5 text-lg focus:outline-none focus:border-orange-500 transition"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            onKeyDown={handleCategoryKeyDown}
                        />
                        <input
                            ref={descriptionRef}
                            type="text"
                            placeholder="Description (e.g., Monthly shop rent)"
                            className="bg-gray-800/70 border border-gray-700 rounded-2xl px-6 py-5 text-lg focus:outline-none focus:border-orange-500 transition"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onKeyDown={handleDescriptionKeyDown}
                        />
                        <input
                            ref={amountRef}
                            type="number"
                            placeholder="Amount (Tk)"
                            className="bg-gray-800/70 border border-gray-700 rounded-2xl px-6 py-5 text-lg text-center font-bold focus:outline-none focus:border-orange-500 transition"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            onKeyDown={handleAmountKeyDown}
                        />
                    </div>
                    <div className="flex justify-center sm:justify-start">
                        <button
                            onClick={handleAddExpense}
                            className="w-full sm:w-auto px-12 sm:px-16 py-5 sm:py-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 rounded-2xl font-bold text-xl sm:text-2xl shadow-2xl transition transform hover:scale-105"
                        >
                            ➕ Record Expense
                        </button>
                    </div>
                </div>

                {/* Expense History Table - Responsive */}
                <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-6 sm:p-8 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                            <label className="text-lg sm:text-xl font-semibold whitespace-nowrap">Filter by Date:</label>
                            <input
                                type="date"
                                className="bg-gray-800/70 border border-gray-700 rounded-xl px-4 py-3 focus:border-orange-500 focus:outline-none w-full sm:w-auto"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-gray-800/50">
                                <tr>
                                    {["Date", "Category", "Description", "Amount", "Running Total", "Actions"].map(h => (
                                        <th key={h} className="px-4 sm:px-8 py-5 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider opacity-80">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {filteredExpenses().length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 sm:py-20 text-center text-gray-500 text-lg sm:text-xl">
                                            {filterDate ? "No expenses found for selected date" : "No expenses recorded yet"}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredExpenses().map((exp) => {
                                        const isEditing = editExpense === exp.id;
                                        return (
                                            <tr key={exp.id} className="hover:bg-gray-800/40 transition">
                                                <td className="px-4 sm:px-8 py-5 text-sm sm:text-lg">
                                                    {new Date(exp.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-4 sm:px-8 py-5">
                                                    {isEditing ? (
                                                        <input type="text" className="bg-gray-700 rounded px-3 py-2 w-full sm:w-40 text-sm" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
                                                    ) : <span className="font-semibold">{exp.category}</span>}
                                                </td>
                                                <td className="px-4 sm:px-8 py-5 text-sm max-w-xs truncate">
                                                    {isEditing ? (
                                                        <input type="text" className="bg-gray-700 rounded px-3 py-2 w-full text-sm" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                                                    ) : <span className="opacity-90">{exp.description || "-"}</span>}
                                                </td>
                                                <td className="px-4 sm:px-8 py-5 text-right font-bold text-lg sm:text-xl text-red-400">
                                                    {isEditing ? (
                                                        <input type="number" className="bg-gray-700 rounded px-3 py-2 w-24 sm:w-32 text-right text-sm" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                                                    ) : `${exp.amount.toLocaleString()} Tk`}
                                                </td>
                                                <td className="px-4 sm:px-8 py-5 text-right font-bold text-lg sm:text-xl text-red-400">
                                                    {exp.runningTotal.toLocaleString()} Tk
                                                </td>
                                                <td className="px-4 sm:px-8 py-5">
                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                        {isEditing ? (
                                                            <button onClick={saveEditExpense} className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold transition">
                                                                Save
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => handleEditExpense(exp.id, exp)} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-xl text-sm font-medium transition">
                                                                Edit
                                                            </button>
                                                        )}
                                                        <button onClick={() => deleteExpense(exp.id)} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl text-sm font-semibold transition">
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
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
    );
}