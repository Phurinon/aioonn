export default function FilterTabs() {
  const tabs = [
    { label: "ทั้งหมด(7)", active: true },
    { label: "ใช้งานล่าสุดวันนี้" },
    { label: "ยังไม่เคยใช้งาน" },
  ];

  return (
    <div className="flex gap-3">
      {tabs.map((tab, i) => (
        <a
          key={i}
          href="/#"
          className={`px-5 py-2 rounded-full border text-sm font-medium
            ${
              tab.active
                ? "bg-teal-400 text-white border-teal-400"
                : "bg-white text-gray-600"
            }`}
        >
          {tab.label}
        </a>
      ))}
    </div>
  );
}
