// App.jsx

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Members from "./pages/Members.jsx";
import Expenses from "./pages/Expenses.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import MemberInfo from "./pages/MemberInfo.jsx";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/memberinfo" element={<MemberInfo />} />
        <Route path="/settings" element={<Settings />} />

        {/* Fallback - 404 এর জায়গায় Login এ পাঠিয়ে দাও (সাধারণত এটাই করা হয়) */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;