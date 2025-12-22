// App.jsx - Updated with Analysis page
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Members from "./pages/Members.jsx";
import Expenses from "./pages/Expenses.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import MemberInfo from "./pages/MemberInfo.jsx";
import Analysis from "./pages/Analysis.jsx"; // 🔥 নতুন পেজ ইমপোর্ট

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/analysis" element={<Analysis />} /> {/* 🔥 নতুন রাউট */}
        <Route path="/reports" element={<Reports />} />
        <Route path="/memberinfo" element={<MemberInfo />} />
        <Route path="/settings" element={<Settings />} />

        {/* Fallback - Any unknown route goes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;