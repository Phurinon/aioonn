import { createBrowserRouter } from "react-router-dom";
import Layout from "../layouts/default.jsx";
import ProtectedRoute from "./ProtectedRoute";
import ActivityLayout from "../layouts/ActivityLayout.jsx";
import Dashboard from "../page/Dashboard.jsx";
import SelectCategory from "../page/SelectCategory.jsx";
import SelectMode from "../page/SelectMode.jsx";
import AssistedArmRaise from "../page/AssistedArmRaise.jsx";
import ByselfArmRaise from "../page/ByselfArmRaise.jsx";
import CountArmRaise from "../page/CountArmRaise.jsx";
import TimerCountArmRaise from "../page/TimerCountArmRaise.jsx";
import Balance from "../page/Balance.jsx";
import Standing from "../page/Standing.jsx";
import MusleTraining from "../page/MusleTraining.jsx";
import Stretching from "../page/Stretching.jsx";
import Login from "../page/Login.jsx";
import Register from "../page/Register.jsx";
import Profile from "../page/Profile.jsx";
import TherapyHistory from "../page/TherapyHistory.jsx";
import Summary from "../page/Summary.jsx";
import DailyRomTesting from "../page/DailyRomTesting.jsx";

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
          // หน้า Activity - มีผู้ช่วยยกแขน
          {
            path: "activity/:patientId/arm-raise/assisted",
            element: <AssistedArmRaise />,
          },
          // หน้า Activity - ยกแขนด้วยตัวเอง
          {
            path: "activity/:patientId/arm-raise/self",
            element: <ByselfArmRaise />,
          },
          // หน้า Activity - นับจำนวน
          {
            path: "activity/:patientId/arm-raise/count",
            element: <CountArmRaise />,
          },
          // หน้า Activity - จับเวลา
          {
            path: "activity/:patientId/arm-raise/timer",
            element: <TimerCountArmRaise />,
          },
          // หน้า Activity - ทดสอบการทรงตัว (แกนกลางลำตัว)
          { path: "activity/:patientId/core/balance", element: <Balance /> },
          // หน้า Activity - ปรับท่ายืน (แกนกลางลำตัว)
          { path: "activity/:patientId/core/posture", element: <Standing /> },
          // หน้า Activity - เสริมสร้างกล้ามเนื้อ (การออกกำลังกาย)
          {
            path: "activity/:patientId/exercise/strength",
            element: <MusleTraining />,
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
