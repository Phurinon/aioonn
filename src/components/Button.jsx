import React from 'react';
import { Icon } from '@iconify/react';

function Button() {
  return (
    <div
      className="flex items-center justify-center p-5 rounded-[35px] bg-[#36C6D3] shadow-2xl text-white text-xl font-medium font-sans w-48 h-17 gap-2 m-4 cursor-pointer"
    >
      <Icon icon="ph:plus" width="24" height="24" />
      <span>เพิ่มผู้ป่วย</span>
    </div>
  );
}

export default Button;
