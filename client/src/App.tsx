import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OtpVerification from "./pages/OtpVerification";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import DashboardLayout from "./pages/dashboard/Layout";
import Generate from "./pages/dashboard/Generate";
import History from "./pages/dashboard/History";
import HistoryDetail from "./pages/dashboard/HistoryDetail";
import Billing from "./pages/dashboard/Billing";
import Settings from "./pages/dashboard/Settings";
import Bulk from "./pages/dashboard/Bulk";
import AdminLayout from "./pages/admin/Layout";
import AdminOverview from "./pages/admin/Overview";
import AdminUsers from "./pages/admin/Users";
import AdminTransactions from "./pages/admin/Transactions";
import AdminRevenue from "./pages/admin/Revenue";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/otp-verification" element={<OtpVerification />} />

        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="generate" replace />} />
            <Route path="generate" element={<Generate />} />
            <Route path="history">
              <Route index element={<History />} />
              <Route path=":id" element={<HistoryDetail />} />
            </Route>
            <Route path="bulk" element={<Bulk />} />
            <Route path="billing" element={<Billing />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="revenue" element={<AdminRevenue />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
