import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllUsers } from "../../Functions/user";
import { getPatients } from "../../Functions/patient";
import { getTherapyType } from "../../Functions/therapy";
import { UserGroupIcon, UsersIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, patients: 0, therapies: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, patientsRes, therapiesRes] = await Promise.all([
          getAllUsers(),
          getPatients(), // get all patients without userId filter
          getTherapyType()
        ]);
        
        setStats({
          users: usersRes.data?.length || 0,
          patients: patientsRes?.length || 0,
          therapies: therapiesRes.data?.length || 0,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-full">กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-6 mt-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Stats Card */}
        <Link to="/admin/users" className="block">
          <div className="bg-white rounded-[24px] p-6 shadow-md hover:shadow-xl transition-shadow border border-gray-100 flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
              <UserGroupIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">ผู้ใช้งานทั้งหมด</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.users}</h3>
            </div>
          </div>
        </Link>

        {/* Patient Stats Card */}
        <Link to="/admin/patients" className="block">
          <div className="bg-white rounded-[24px] p-6 shadow-md hover:shadow-xl transition-shadow border border-gray-100 flex items-center gap-6">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
              <UsersIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">ผู้ป่วยทั้งหมด</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.patients}</h3>
            </div>
          </div>
        </Link>
        {/* Therapy Stats Card */}
        <Link to="/admin/therapy" className="block md:col-span-2 lg:col-span-1">
          <div className="bg-white rounded-[24px] p-6 shadow-md hover:shadow-xl transition-shadow border border-gray-100 flex items-center gap-6">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shrink-0">
              <WrenchScrewdriverIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">รูปแบบการรักษา</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.therapies}</h3>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Additional Dashboard Widgets can go here */}
      <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">ยินดีต้อนรับสู่ส่วนจัดการระบบ</h3>
        <p className="text-gray-600">
            ใช้เมนูด้านซ้ายเพื่อเริ่มต้นการจัดการผู้ใช้งาน และผู้ป่วยในระบบ
        </p>
      </div>
    </div>
  );
}
