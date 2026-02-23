import React, { useState, useEffect } from "react";
import { getAllUsers, deleteUser } from "../../Functions/user";
import Swal from "sweetalert2";
import { UserIcon, TrashIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถดึงข้อมูลผู้ใช้งานได้",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id, username) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบ",
      text: `คุณต้องการลบผู้ใช้งาน ${username} ใช่หรือไม่?`,
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#40C9D5",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        await deleteUser(id);
        setUsers(users.filter((u) => u.id !== id));
        Swal.fire({
          icon: "success",
          title: "สำเร็จ",
          text: "ลบผู้ใช้งานสำเร็จ",
          confirmButtonColor: "#40C9D5",
        });
      } catch (error) {
        console.error("Error deleting user:", error);
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถลบผู้ใช้งานได้",
          confirmButtonColor: "#40C9D5",
        });
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">กำลังโหลด...</div>;
  }

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">จัดการผู้ใช้งาน</h2>
          <p className="text-sm text-gray-500 mt-1">
            รายการผู้ใช้งานทั้งหมดในระบบ (สิทธิ์ Hospital/Admin)
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm">
              <th className="py-4 px-6 font-semibold">ID</th>
              <th className="py-4 px-6 font-semibold">ชื่อที่แสดง</th>
              <th className="py-4 px-6 font-semibold">ชื่อผู้ใช้ (Username)</th>
              <th className="py-4 px-6 font-semibold">บทบาท (Role)</th>
              <th className="py-4 px-6 font-semibold text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-gray-800">{user.id}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-800">
                        {user.displayName}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">{user.username}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-600"
                          : "bg-blue-100 text-[#40C9D5]"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 flex justify-center gap-2">
                    <button
                      onClick={() =>
                        Swal.fire({
                          icon: "info",
                          title: "ข้อมูล",
                          text: `สร้างเมื่อ: ${new Date(
                            user.createdAt
                          ).toLocaleString("th-TH")}`,
                        })
                      }
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <InformationCircleIcon className="w-5 h-5" />
                    </button>
                    {user.role !== "admin" && (
                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-500">
                  ไม่พบข้อมูลผู้ใช้งาน
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
