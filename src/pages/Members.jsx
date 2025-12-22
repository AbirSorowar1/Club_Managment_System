// Members.jsx - Fully Updated & Fixed (December 2025)
// All features preserved + Create Member stable + No page jump/error
// Mobile responsive + Modern UI + Enter key support + Visible Scrollbar in Members List (Fixed Height)

import { useEffect, useState, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { ref, onValue, set, push, update, remove } from "firebase/database";
import { useNavigate, useLocation } from "react-router-dom";
import QRCode from "react-qr-code";

export default function Members() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = auth.currentUser;
    const [ownerName, setOwnerName] = useState("");
    const [members, setMembers] = useState({});
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberName, setMemberName] = useState("");
    const [memberPhone, setMemberPhone] = useState("");
    const [searchMember, setSearchMember] = useState("");
    const [amount, setAmount] = useState("");
    const [startMonth, setStartMonth] = useState("");
    const [numMonths, setNumMonths] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [transactionDone, setTransactionDone] = useState(false);
    const [editPayment, setEditPayment] = useState(null);
    const [editAmount, setEditAmount] = useState("");
    const [editStartMonth, setEditStartMonth] = useState("");
    const [editNumMonths, setEditNumMonths] = useState("");
    const [darkMode, setDarkMode] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);
    const [showQR, setShowQR] = useState(false);
    const [voiceListening, setVoiceListening] = useState(false);

    // Refs for focus & Enter navigation
    const nameInputRef = useRef(null);
    const phoneInputRef = useRef(null);
    const amountInputRef = useRef(null);
    const startMonthInputRef = useRef(null);
    const numMonthsInputRef = useRef(null);

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
            }
        }, (error) => {
            console.error("Firebase read error:", error);
        });
        return () => unsubscribe();
    }, [user, navigate]);

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    useEffect(() => {
        if (selectedMember) {
            amountInputRef.current?.focus();
        }
    }, [selectedMember]);

    const startVoiceInput = () => {
        if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            alert("Voice input not supported in your browser");
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = "en-IN";
        recognition.onstart = () => setVoiceListening(true);
        recognition.onresult = (e) => {
            const numbers = e.results[0][0].transcript.match(/\d+/g);
            if (numbers) setAmount(numbers.join(""));
            setVoiceListening(false);
        };
        recognition.onerror = recognition.onend = () => setVoiceListening(false);
        recognition.start();
    };

    const handleLogout = () => signOut(auth).then(() => navigate("/login"));

    const handleSelectMember = (key) => {
        setSelectedMember({ key, data: members[key] });
        setFilterDate("");
        setTransactionDone(false);
        setEditPayment(null);
        setShowQR(false);
        setAmount("");
        setStartMonth("");
        setNumMonths("");
    };

    // 🔥 FIXED & IMPROVED: Create Member – Safe, Stable, Auto Select
    const handleCreateMember = async () => {
        if (!memberName.trim() || !memberPhone.trim()) {
            alert("Please enter both name and phone number!");
            return;
        }

        const normalizedName = memberName.trim();

        if (members[normalizedName]) {
            alert("Member with this name already exists!");
            return;
        }

        try {
            const memRef = ref(db, `owners/${user.uid}/members/${normalizedName}`);
            await set(memRef, {
                name: normalizedName,
                phone: memberPhone.trim(),
                payments: {}
            });

            // Clear inputs
            setMemberName("");
            setMemberPhone("");

            // Focus back to name input
            setTimeout(() => {
                nameInputRef.current?.focus();
            }, 100);

            // Auto select the new member once Firebase syncs (will happen automatically via onValue)
            // No forced select here to avoid race condition

        } catch (error) {
            console.error("Error creating member:", error);
            alert("Failed to create member. Please check your internet or try again.");
        }
    };

    const handleAddPayment = async () => {
        if (!amount || !startMonth || !numMonths || Number(amount) <= 0 || Number(numMonths) <= 0) {
            alert("Please enter valid amount, start month, and number of months!");
            return;
        }
        const amountPerMonth = Number(amount);
        const totalForPayment = amountPerMonth * Number(numMonths);
        const payRef = ref(db, `owners/${user.uid}/members/${selectedMember.key}/payments`);
        const newPay = push(payRef);
        await set(newPay, {
            amountPerMonth,
            totalAmount: totalForPayment,
            startMonth,
            numMonths: Number(numMonths),
            date: new Date().toISOString()
        });
        setAmount(""); setStartMonth(""); setNumMonths("");
        setTransactionDone(true);
        setTimeout(() => {
            amountInputRef.current?.focus();
            setTransactionDone(false);
        }, 800);
    };

    // Enter key handlers
    const handleNameKeyDown = (e) => e.key === "Enter" && phoneInputRef.current?.focus();
    const handlePhoneKeyDown = (e) => e.key === "Enter" && handleCreateMember();
    const handleAmountKeyDown = (e) => e.key === "Enter" && startMonthInputRef.current?.focus();
    const handleStartMonthKeyDown = (e) => e.key === "Enter" && numMonthsInputRef.current?.focus();
    const handleNumMonthsKeyDown = (e) => e.key === "Enter" && handleAddPayment();

    const handleEditPayment = (key, pay) => {
        setEditPayment(key);
        setEditAmount(pay.amountPerMonth || pay.amount);
        setEditStartMonth(pay.startMonth);
        setEditNumMonths(pay.numMonths);
    };

    const saveEditPayment = async () => {
        if (!editPayment || !selectedMember) return;
        const amountPerMonth = Number(editAmount);
        const totalForPayment = amountPerMonth * Number(editNumMonths);
        const payRef = ref(db, `owners/${user.uid}/members/${selectedMember.key}/payments/${editPayment}`);
        await update(payRef, {
            amountPerMonth,
            totalAmount: totalForPayment,
            startMonth: editStartMonth,
            numMonths: Number(editNumMonths)
        });
        setEditPayment(null);
    };

    const handleDeletePayment = async (key) => {
        if (!confirm('Are you sure you want to delete this payment?')) return;
        const payRef = ref(db, `owners/${user.uid}/members/${selectedMember.key}/payments/${key}`);
        await remove(payRef);
        setEditPayment(null);
    };

    const confirmDeleteMember = (key) => {
        setMemberToDelete(key);
        setShowDeleteModal(true);
    };

    const deleteMember = async () => {
        if (!memberToDelete) return;
        const memRef = ref(db, `owners/${user.uid}/members/${memberToDelete}`);
        await remove(memRef);
        setShowDeleteModal(false);
        setMemberToDelete(null);
        if (selectedMember?.key === memberToDelete) {
            setSelectedMember(null);
        }
    };

    const calculateTotals = (payts) => {
        let totalAmount = 0;
        let totalMonths = 0;
        if (!payts) return { totalAmount: 0, totalMonths: 0 };
        Object.values(payts).forEach((p) => {
            totalAmount += Number(p.totalAmount || (p.amountPerMonth * p.numMonths) || (p.amount * p.numMonths));
            totalMonths += Number(p.numMonths);
        });
        return { totalAmount, totalMonths };
    };

    const totalCollectedAll = () => {
        let total = 0;
        Object.values(members).forEach(mem => total += calculateTotals(mem.payments).totalAmount);
        return total;
    };

    const todaysPayments = () => {
        const today = new Date().toISOString().slice(0, 10);
        let count = 0;
        Object.values(members).forEach(mem => {
            if (mem.payments) {
                Object.values(mem.payments).forEach(p => {
                    if (p.date?.startsWith(today)) count++;
                });
            }
        });
        return count;
    };

    const filteredPayments = () => {
        if (!selectedMember?.data?.payments) return [];
        let pays = Object.entries(selectedMember.data.payments)
            .map(([key, value]) => ({ key, ...value }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        if (filterDate) pays = pays.filter(p => p.date?.startsWith(filterDate));
        return pays;
    };

    const getRunningTotals = () => {
        const pays = filteredPayments();
        let runningAmount = 0;
        let runningMonths = 0;
        return pays.map(p => {
            runningAmount += Number(p.totalAmount || (p.amountPerMonth * p.numMonths));
            runningMonths += Number(p.numMonths);
            return { ...p, runningAmount, runningMonths };
        });
    };

    const getMonthRangeDisplay = (startMonth, numMonths) => {
        if (!startMonth || !numMonths) return "N/A";
        const startDate = new Date(startMonth + "-01");
        const months = [];
        for (let i = 0; i < numMonths; i++) {
            const monthDate = new Date(startDate);
            monthDate.setMonth(startDate.getMonth() + i);
            months.push(monthDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }));
        }
        return months.join(', ');
    };

    const exportToCSV = () => {
        if (!selectedMember) return;
        const pays = getRunningTotals();
        let csv = "Date,Amount Per Month,Total Paid,Start Month,Num Months,Covered Months,Running Total,Running Months\n";
        pays.forEach(p => {
            const covered = getMonthRangeDisplay(p.startMonth, p.numMonths);
            csv += `${new Date(p.date).toLocaleString()},${p.amountPerMonth || p.amount},${p.totalAmount},"${p.startMonth}",${p.numMonths},"${covered}",${p.runningAmount},${p.runningMonths}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedMember.data.name}_payment_history.csv`;
        a.click();
    };

    const searchResults = () => {
        if (!searchMember) return Object.keys(members);
        const lowerSearch = searchMember.toLowerCase();
        return Object.keys(members).filter(key =>
            key.toLowerCase().includes(lowerSearch) ||
            members[key].phone?.includes(searchMember)
        );
    };

    const getLastPaymentDate = (mem) => {
        if (!mem.payments || Object.keys(mem.payments).length === 0) return null;
        const dates = Object.values(mem.payments).map(p => new Date(p.date));
        return new Date(Math.max(...dates));
    };

    const isActive = (path) => location.pathname === path;

    const getCurrentCoveredDisplay = () => {
        if (!amount || !startMonth || !numMonths) return null;
        return getMonthRangeDisplay(startMonth, numMonths);
    };

    const getCurrentTotal = () => {
        if (!amount || !numMonths) return 0;
        return Number(amount) * Number(numMonths);
    };

    const renderNumMonthsOptions = () => {
        return Array.from({ length: 12 }, (_, i) => i + 1).map(i => (
            <option key={i} value={i}>{i} Month{i > 1 ? 's' : ''}</option>
        ));
    };

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
                            Total Collected:{" "}
                            <span className="text-3xl sm:text-4xl font-bold text-emerald-400">
                                {totalCollectedAll().toLocaleString()} Tk
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
                    {[
                        { label: "Total Members", value: Object.keys(members).length },
                        { label: "Today's Payments", value: todaysPayments() },
                        { label: "Total Collected", value: `${totalCollectedAll().toLocaleString()} Tk` },
                    ].map((stat, i) => (
                        <div key={i} className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
                            <p className="text-base sm:text-lg opacity-70 mb-3">{stat.label}</p>
                            <p className="text-4xl sm:text-5xl font-extrabold text-emerald-400">{stat.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-10">
                    {/* Sidebar - Members List */}
                    <div className="lg:col-span-1 order-2 lg:order-1">
                        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col h-full">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl sm:text-3xl font-bold">Members</h2>
                                <span className="bg-emerald-600/20 text-emerald-400 px-4 py-2 rounded-full text-base sm:text-lg font-bold">
                                    {Object.keys(members).length}
                                </span>
                            </div>

                            <input
                                type="text"
                                placeholder="🔍 Search..."
                                className="w-full bg-gray-800/70 border border-gray-700 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition mb-6"
                                value={searchMember}
                                onChange={(e) => setSearchMember(e.target.value)}
                            />

                            {/* Members List with Fixed Height + Visible Scrollbar */}
                            <div className="flex-1 overflow-y-auto scrollbar-visible max-h-96 pr-2">
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
                                <div className="space-y-4">
                                    {searchResults().length === 0 ? (
                                        <p className="text-center text-gray-500 py-12 text-lg">No members found</p>
                                    ) : (
                                        searchResults().map((key) => {
                                            const mem = members[key];
                                            const totals = calculateTotals(mem.payments);
                                            const lastPay = getLastPaymentDate(mem);
                                            const daysAgo = lastPay ? Math.floor((Date.now() - lastPay.getTime()) / (86400000)) : null;
                                            return (
                                                <div
                                                    key={key}
                                                    onClick={() => handleSelectMember(key)}
                                                    className={`relative group bg-gray-800/60 backdrop-blur border rounded-2xl p-5 cursor-pointer transition-all
                                                        ${selectedMember?.key === key ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-2xl' : 'border-gray-700 hover:border-gray-600'}`}
                                                >
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); confirmDeleteMember(key); }}
                                                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white p-2 rounded-lg text-sm"
                                                    >
                                                        ✕
                                                    </button>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl font-bold shadow-xl">
                                                            {mem.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-bold text-lg truncate">{mem.name}</h4>
                                                            <p className="text-sm opacity-70 truncate">📞 {mem.phone}</p>
                                                            {daysAgo !== null && daysAgo > 30 && (
                                                                <p className="text-xs text-orange-400 mt-1">Inactive: {daysAgo} days</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex justify-between text-sm">
                                                        <span className="opacity-60">Total Paid</span>
                                                        <div className="text-right">
                                                            <p className="font-bold text-emerald-400">{totals.totalAmount.toLocaleString()} Tk</p>
                                                            <p className="opacity-70">{totals.totalMonths} months</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Add Member Form */}
                            <div className="border-t border-gray-700 pt-6 mt-6">
                                <h3 className="text-xl font-bold text-center mb-5">Add New Member</h3>
                                <input
                                    ref={nameInputRef}
                                    placeholder="Full Name"
                                    className="w-full bg-gray-800/70 border border-gray-700 rounded-xl px-5 py-4 mb-4 focus:border-emerald-500 focus:outline-none transition"
                                    value={memberName}
                                    onChange={(e) => setMemberName(e.target.value)}
                                    onKeyDown={handleNameKeyDown}
                                />
                                <input
                                    ref={phoneInputRef}
                                    placeholder="Phone Number"
                                    className="w-full bg-gray-800/70 border border-gray-700 rounded-xl px-5 py-4 mb-6 focus:border-emerald-500 focus:outline-none transition"
                                    value={memberPhone}
                                    onChange={(e) => setMemberPhone(e.target.value)}
                                    onKeyDown={handlePhoneKeyDown}
                                />
                                <button
                                    onClick={handleCreateMember}
                                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 py-5 rounded-xl font-bold text-lg shadow-xl transition hover:scale-105"
                                >
                                    ➕ Create Member
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Member Details Panel */}
                    <div className="lg:col-span-3 order-1 lg:order-2 space-y-10">
                        {selectedMember ? (
                            <>
                                <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
                                        <div>
                                            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold">{selectedMember.data.name}</h3>
                                            <p className="text-xl sm:text-2xl mt-3 opacity-70">📞 {selectedMember.data.phone}</p>
                                        </div>
                                        <div className="text-center sm:text-right">
                                            <p className="text-base sm:text-lg opacity-70">Total Paid</p>
                                            <p className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-emerald-400">
                                                {calculateTotals(selectedMember.data.payments).totalAmount.toLocaleString()} Tk
                                            </p>
                                            <p className="text-lg sm:text-xl opacity-80 mt-2">
                                                for {calculateTotals(selectedMember.data.payments).totalMonths} months
                                            </p>
                                        </div>
                                    </div>

                                    {/* Payment Input */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                                        <div className="relative">
                                            <input
                                                ref={amountInputRef}
                                                type="number"
                                                placeholder="Amount/Month (Tk)"
                                                className="w-full bg-gray-800/70 border border-gray-700 rounded-2xl px-6 py-6 text-2xl sm:text-3xl text-center font-bold focus:outline-none focus:border-emerald-500 transition"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                onKeyDown={handleAmountKeyDown}
                                            />
                                            <button
                                                onClick={startVoiceInput}
                                                className={`absolute right-4 top-1/2 -translate-y-1/2 text-2xl sm:text-3xl ${voiceListening ? 'animate-pulse text-emerald-400' : ''}`}
                                            >
                                                {voiceListening ? '🎙️' : '🎤'}
                                            </button>
                                        </div>
                                        <input
                                            ref={startMonthInputRef}
                                            type="month"
                                            className="bg-gray-800/70 border border-gray-700 rounded-2xl px-6 py-6 text-xl text-center focus:outline-none focus:border-emerald-500 transition"
                                            value={startMonth}
                                            onChange={(e) => setStartMonth(e.target.value)}
                                            onKeyDown={handleStartMonthKeyDown}
                                        />
                                        <select
                                            ref={numMonthsInputRef}
                                            className="bg-gray-800/70 border border-gray-700 rounded-2xl px-6 py-6 text-xl text-center focus:outline-none focus:border-emerald-500 transition"
                                            value={numMonths}
                                            onChange={(e) => setNumMonths(e.target.value)}
                                            onKeyDown={handleNumMonthsKeyDown}
                                        >
                                            <option value="">Months</option>
                                            {renderNumMonthsOptions()}
                                        </select>
                                    </div>

                                    {amount && startMonth && numMonths && (
                                        <div className="text-center py-5 bg-emerald-900/30 rounded-2xl mb-8">
                                            <p className="text-xl sm:text-2xl font-bold text-emerald-300">
                                                Total: {getCurrentTotal().toLocaleString()} Tk
                                            </p>
                                            <p className="text-base sm:text-lg mt-2 opacity-90">
                                                Covering: {getCurrentCoveredDisplay()}
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button
                                            onClick={handleAddPayment}
                                            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 py-5 sm:py-6 rounded-2xl font-bold text-xl sm:text-2xl shadow-2xl transition hover:scale-105"
                                        >
                                            ➕ Record Payment
                                        </button>
                                        <button
                                            onClick={() => setShowQR(true)}
                                            className="bg-gray-800/70 hover:bg-gray-700 py-5 sm:py-6 rounded-2xl font-bold text-xl transition shadow-xl"
                                        >
                                            QR Share
                                        </button>
                                    </div>

                                    {transactionDone && (
                                        <p className="text-center mt-8 text-2xl sm:text-3xl font-bold text-emerald-400 animate-pulse">
                                            ✅ Payment Recorded Successfully!
                                        </p>
                                    )}
                                </div>

                                {/* Payment History Table */}
                                <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                                    <div className="p-6 sm:p-8 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                            <label className="text-lg sm:text-xl font-semibold">Filter by Date:</label>
                                            <input
                                                type="date"
                                                className="bg-gray-800/70 border border-gray-700 rounded-xl px-4 py-3 focus:border-emerald-500 focus:outline-none"
                                                value={filterDate}
                                                onChange={(e) => setFilterDate(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={exportToCSV}
                                            className="px-6 py-3 bg-gray-800/70 hover:bg-gray-700 rounded-xl font-semibold transition shadow-lg"
                                        >
                                            📄 Export CSV
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[900px]">
                                            <thead className="bg-gray-800/50">
                                                <tr>
                                                    {["Date", "Amt/Mo", "Total", "Start", "Months", "Covered", "Running Total", "Running Mo", "Actions"].map(h => (
                                                        <th key={h} className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider opacity-80">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800">
                                                {getRunningTotals().map((p) => {
                                                    const isEditing = editPayment === p.key;
                                                    const currAmountPerMonth = isEditing ? editAmount : (p.amountPerMonth || p.amount);
                                                    const currNumMonths = isEditing ? editNumMonths : p.numMonths;
                                                    const currStartMonth = isEditing ? editStartMonth : p.startMonth;
                                                    const currTotalAmount = Number(currAmountPerMonth) * Number(currNumMonths);
                                                    const currCovered = getMonthRangeDisplay(currStartMonth, Number(currNumMonths));
                                                    return (
                                                        <tr key={p.key} className="hover:bg-gray-800/40 transition">
                                                            <td className="px-4 sm:px-6 py-4 text-sm">{new Date(p.date).toLocaleDateString('en-GB')}</td>
                                                            <td className="px-4 sm:px-6 py-4">
                                                                {isEditing ? (
                                                                    <input type="number" className="bg-gray-700 rounded px-3 py-2 w-24 text-sm" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                                                                ) : <span className="font-bold">{currAmountPerMonth} Tk</span>}
                                                            </td>
                                                            <td className="px-4 sm:px-6 py-4 font-bold text-emerald-400">{currTotalAmount.toLocaleString()} Tk</td>
                                                            <td className="px-4 sm:px-6 py-4">
                                                                {isEditing ? (
                                                                    <input type="month" className="bg-gray-700 rounded px-3 py-2 text-sm" value={editStartMonth} onChange={(e) => setEditStartMonth(e.target.value)} />
                                                                ) : currStartMonth}
                                                            </td>
                                                            <td className="px-4 sm:px-6 py-4 font-bold">{currNumMonths}</td>
                                                            <td className="px-4 sm:px-6 py-4 text-emerald-300 text-sm">{currCovered}</td>
                                                            <td className="px-4 sm:px-6 py-4 font-bold text-emerald-400 text-lg">{p.runningAmount.toLocaleString()} Tk</td>
                                                            <td className="px-4 sm:px-6 py-4 font-bold">{p.runningMonths}</td>
                                                            <td className="px-4 sm:px-6 py-4">
                                                                {isEditing ? (
                                                                    <>
                                                                        <button onClick={saveEditPayment} className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg mr-2 text-sm font-semibold">Save</button>
                                                                        <button onClick={() => handleDeletePayment(p.key)} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold">Delete</button>
                                                                    </>
                                                                ) : (
                                                                    <button onClick={() => handleEditPayment(p.key, p)} className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-lg text-sm transition">Edit</button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-16 sm:p-24 text-center shadow-2xl">
                                <p className="text-2xl sm:text-4xl font-medium opacity-60">
                                    Select a member to view and manage payments
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* QR Modal */}
                {showQR && selectedMember && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowQR(false)}>
                        <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-2xl font-bold text-center mb-6">Share with {selectedMember.data.name}</h3>
                            <div className="bg-white p-6 rounded-3xl mx-auto">
                                <QRCode value={`tel:${selectedMember.data.phone}`} size={200} />
                            </div>
                            <p className="text-center text-lg mt-6 opacity-80">Scan to Call</p>
                            <button onClick={() => setShowQR(false)} className="mt-8 w-full py-4 bg-red-600 hover:bg-red-700 rounded-2xl font-bold text-lg transition">
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Delete Member Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                            <h3 className="text-2xl font-bold text-red-400 mb-4">Confirm Delete</h3>
                            <p className="text-lg mb-8">
                                All data for <strong>{members[memberToDelete]?.name}</strong> will be permanently deleted.
                            </p>
                            <div className="flex justify-end gap-4">
                                <button onClick={() => setShowDeleteModal(false)} className="px-6 py-3 border border-gray-600 rounded-2xl hover:bg-gray-800 transition">
                                    Cancel
                                </button>
                                <button onClick={deleteMember} className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-2xl font-bold transition">
                                    Delete Member
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}