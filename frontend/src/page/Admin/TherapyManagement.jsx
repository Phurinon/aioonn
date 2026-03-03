import React, { useState, useEffect } from "react";
import { getTherapyType, addTherapyType, updateTherapyType, deleteTherapyType } from "../../Functions/therapy";
import Swal from "sweetalert2";
import { WrenchScrewdriverIcon, TrashIcon, PencilSquareIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function TherapyManagement() {
  const [therapies, setTherapies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [currentTherapy, setCurrentTherapy] = useState({
    id: null,
    title: "",
    description: "",
    slug: "",
    category: "active"
  });

  const fetchTherapies = async () => {
    try {
      const response = await getTherapyType();
      setTherapies(response.data);
    } catch (error) {
      console.error("Error fetching therapies:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถดึงข้อมูลรูปแบบการรักษาได้",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTherapies();
  }, []);

  const openAddModal = () => {
    setModalMode("add");
    setCurrentTherapy({ id: null, title: "", description: "", slug: "", category: "active" });
    setIsModalOpen(true);
  };

  const openEditModal = (therapy) => {
    setModalMode("edit");
    setCurrentTherapy({
      id: therapy.id,
      title: therapy.title || "",
      description: therapy.description || "",
      slug: therapy.slug || "",
      category: therapy.category || "active"
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentTherapy(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentTherapy.title) {
        Swal.fire({ icon: "warning", text: "กรุณากรอกชื่อการรักษา", confirmButtonColor: "#40C9D5" });
        return;
    }

    try {
      if (modalMode === "add") {
        await addTherapyType(currentTherapy);
        Swal.fire({ icon: "success", title: "สำเร็จ", text: "เพิ่มข้อมูลเรียบร้อยแล้ว", confirmButtonColor: "#40C9D5" });
      } else {
        await updateTherapyType(currentTherapy.id, currentTherapy);
        Swal.fire({ icon: "success", title: "สำเร็จ", text: "อัปเดตข้อมูลเรียบร้อยแล้ว", confirmButtonColor: "#40C9D5" });
      }
      closeModal();
      fetchTherapies();
    } catch (error) {
      console.error("Error saving therapy:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้",
        confirmButtonColor: "#40C9D5",
      });
    }
  };

  const handleDelete = async (id, title) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบ",
      text: `คุณต้องการลบ "${title}" ใช่หรือไม่?`,
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#40C9D5",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        await deleteTherapyType(id);
        setTherapies(therapies.filter((t) => t.id !== id));
        Swal.fire({
          icon: "success",
          title: "สำเร็จ",
          text: "ลบข้อมูลสำเร็จ",
          confirmButtonColor: "#40C9D5",
        });
      } catch (error) {
        console.error("Error deleting therapy:", error);
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถลบข้อมูลได้ หรือข้อมูลถูกใช้งานอยู่",
          confirmButtonColor: "#40C9D5",
        });
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">กำลังโหลด...</div>;
  }

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">จัดการรูปแบบการรักษา (Therapy Types)</h2>
          <p className="text-sm text-gray-500 mt-1">
            เพิ่ม แก้ไข หรือลบ รูปแบบกิจกรรมการรักษาทั้งหมด
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-[#40C9D5] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#2BA8B4] transition-colors shadow-md shadow-[#40C9D5]/30 font-medium"
        >
          <PlusIcon className="w-5 h-5" />
          เพิ่มรูปแบบใหม่
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm">
              <th className="py-4 px-6 font-semibold">ID</th>
              <th className="py-4 px-6 font-semibold">ชื่อการรักษา</th>
              <th className="py-4 px-6 font-semibold w-1/3">รายละเอียด</th>
              <th className="py-4 px-6 font-semibold">หมวดหมู่</th>
              <th className="py-4 px-6 font-semibold">Slug</th>
              <th className="py-4 px-6 font-semibold text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {therapies.length > 0 ? (
              therapies.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-gray-800">{item.id}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
                        <WrenchScrewdriverIcon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-800">
                        {item.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-500 text-sm truncate max-w-xs" title={item.description}>
                    {item.description || "-"}
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold capitalize">
                      {item.category || "-"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-500 text-sm">
                    {item.slug || "-"}
                  </td>
                  <td className="py-4 px-6 flex justify-center gap-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="แก้ไข"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="ลบ"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">
                  ไม่พบข้อมูลรูปแบบการรักษา
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* React Modal (JSX) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800">
                {modalMode === "add" ? "เพิ่มรูปแบบการรักษา" : "แก้ไขรูปแบบการรักษา"}
              </h3>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Form) */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อการรักษา (Title) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={currentTherapy.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#40C9D5] focus:border-transparent outline-none transition-all"
                  placeholder="เช่น Shoulder Flexion"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียด (Description)
                </label>
                <textarea
                  name="description"
                  value={currentTherapy.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#40C9D5] focus:border-transparent outline-none transition-all resize-none"
                  placeholder="คำอธิบายเพิ่มเติม..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug (สำหรับ URL)
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={currentTherapy.slug}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#40C9D5] focus:border-transparent outline-none transition-all"
                    placeholder="เช่น shoulder-flexion"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หมวดหมู่ (Category)
                  </label>
                  <select
                    name="category"
                    value={currentTherapy.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#40C9D5] focus:border-transparent outline-none transition-all bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="passive">Passive</option>
                    <option value="preset">Preset</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 mt-2 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#40C9D5] to-[#2BA8B4] hover:shadow-lg hover:shadow-[#40C9D5]/30 rounded-xl transition-all"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}