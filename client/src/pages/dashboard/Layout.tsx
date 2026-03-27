import React from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "../../components/Layout/Sidebar";
import Topbar from "../../components/Layout/Topbar";

export default function DashboardLayout() {
  return (
    <div
      className="flex min-h-screen flex-col bg-background text-left text-foreground"
      style={{ width: "100%", textAlign: "left" }}
    >
      <Topbar />
      <div className="flex flex-1">
        <Sidebar />
        <motion.main
          key="dashboard-main"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 overflow-auto"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
