import React, { useState, useEffect } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import { verifyAdmin } from "../Functions/user";
import Layout from "../layouts/default.jsx";
import ProtectedRoute from "./ProtectedRoute";
import ActivityLayout from "../layouts/ActivityLayout.jsx";
import Dashboard from "../page/Dashboard.jsx";
import SelectCategory from "../page/SelectCategory.jsx";
import SelectMode from "../page/SelectMode.jsx";
import ShoulderFlexion from "../page/Active/ShoulderFlexion.jsx";
import ShoulderAbduction from "../page/Active/ShoulderAbduction.jsx";
import ElbowRotation from "../page/Active/ElbowRotation.jsx";
import Balance from "../page/Passive/Balance.jsx";
import Standing from "../page/Passive/Standing.jsx";
import MusleTraining from "../page/Preset/MusleTraining.jsx";
import Stretching from "../page/Preset/Stretching.jsx";
import Login from "../page/Login.jsx";
import Register from "../page/Register.jsx";
import Profile from "../page/Profile.jsx";
import TherapyHistory from "../page/TherapyHistory.jsx";
import Summary from "../page/Summary.jsx";
import DailyRomTesting from "../page/DailyRomTesting.jsx";
import RoutineList from "../page/Preset/RoutineList.jsx";
import RoutineBuilder from "../page/Preset/RoutineBuilder.jsx";
import RoutineRunner from "../page/Preset/RoutineRunner.jsx";
// import AdminLayout from "../layouts/AdminLayout.jsx";
import AdminDashboard from "../page/Admin/AdminDashboard.jsx";
import UserManagement from "../page/Admin/UserManagement.jsx";
import PatientManagement from "../page/Admin/PatientManagement.jsx";
import TherapyManagement from "../page/Admin/TherapyManagement.jsx";

// Role-based Route Guard component (Backend verification)
const AdminRoute = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await verifyAdmin();
        if (response && response.status === 200) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        setIsAuthorized(false);
      }
    };
    
    checkAdmin();
  }, []);

  if (isAuthorized === null) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F3FBFC]">กำลังตรวจสอบสิทธิ์...</div>;
  }

  if (!isAuthorized) {
    setTimeout(() => {
      Swal.fire({
        icon: "error",
        title: "ไม่มีสิทธิ์เข้าถึง",
        text: "หน้านี้สงวนไว้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น",
        confirmButtonColor: "#40C9D5"
      });
    }, 100);
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// สร้าง routes configuration ที่สามารถ reuse ได้
const routes = [
  // Protected Routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        // Layout หลัก - ทุกหน้าที่อยู่ใน children จะใช้ Layout นี้
        path: "/",
        element: <Layout />,
        children: [
          // หน้า Dashboard (index route)
          { index: true, element: <Dashboard /> },
          // หน้าประวัติการรักษา
          { path: "therapy-history", element: <TherapyHistory /> },
        ],
      },
      {
        // Layout สำหรับหน้ากิจกรรม (มีปุ่มย้อนกลับ + Exit)
        path: "/",
        element: <ActivityLayout />,
        children: [
          // หน้าเลือกหมวดหมู่
          { path: "select-category/:patientId", element: <SelectCategory /> },
          // หน้าเลือกโหมด (รับ categoryId จาก URL)
          { path: "select-mode/:patientId/:categoryId", element: <SelectMode /> },
          // หน้า Activity - จับเวลา (Legacy route, kept for safety or remove if unused)
          // New Active Modes
          {
            path: "activity/:patientId/active/shoulder-flexion",
            element: <ShoulderFlexion />,
          },
          {
            path: "activity/:patientId/active/shoulder-abduction",
            element: <ShoulderAbduction />,
          },
          {
            path: "activity/:patientId/active/internal-rotation",
            element: <ElbowRotation />,
          },
          // หน้า Activity - ทดสอบการทรงตัว (แกนกลางลำตัว)
          { path: "activity/:patientId/passive/balance", element: <Balance /> },
          // หน้า Activity - ปรับท่ายืน (แกนกลางลำตัว)
          { path: "activity/:patientId/passive/posture", element: <Standing /> },
          // หน้า Activity - เสริมสร้างกล้ามเนื้อ (การออกกำลังกาย)
          // {
          //   path: "activity/:patientId/exercise/strength",
          //   element: <MusleTraining />,
          // },
          // Routine Flow
          {
            path: "activity/:patientId/routine/list",
            element: <RoutineList />,
          },
          {
            path: "activity/:patientId/routine/create",
            element: <RoutineBuilder />,
          },
          {
            path: "activity/:patientId/routine/edit/:routineId",
            element: <RoutineBuilder />,
          },
          {
            path: "activity/:patientId/routine/run/:routineId",
            element: <RoutineRunner />,
          },
          // หน้า Activity - ยืดเหยียด (การออกกำลังกาย)
          {
            path: "activity/:patientId/exercise/stretch",
            element: <Stretching />,
          },
          // หน้า Daily ROM Testing
          {
            path: "daily-rom-test/:patientId",
            element: <DailyRomTesting />,
          },
        ],
      },
      // หน้า Profile (ไม่ใช้ Layout หลัก)
      {
        path: "/profile",
        element: <Profile />,
      },
      {
        path: "/summary/:patientId",
        element: <Summary />,
      },
    ],
  },
  
  // Admin Routes (Protected explicitly by check logic inside AdminRoute wrapper & layout)
  {
      path: "/admin",
      element: <ProtectedRoute />,
      children: [
          {
              path: "",
              element: (
                  <AdminRoute>
                      <Layout />
                  </AdminRoute>
              ),
              children: [
                  { index: true, element: <AdminDashboard /> },
                  { path: "users", element: <UserManagement /> },
                  { path: "patients", element: <PatientManagement /> },
                  { path: "therapy", element: <TherapyManagement /> },
              ]
          }
      ]
  },

  // Public Routes
  // หน้า Login (ไม่ใช้ Layout หลัก)
  {
    path: "/login",
    element: <Login />,
  },
  // หน้า Register (ไม่ใช้ Layout หลัก)
  {
    path: "/register",
    element: <Register />,
  },
];

// Export router สำหรับใช้กับ RouterProvider
export const router = createBrowserRouter(routes);

// Export routes configuration สำหรับ reuse
export default routes;
