'use client';

import { FiMenu } from 'react-icons/fi';

interface NavbarProps {
  toggleSidebar: () => void;
}

export default function Navbar({ toggleSidebar }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-50">
      <div className="flex items-center h-full px-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          <FiMenu size={20} />
        </button>
        <h1 className="ml-4 text-xl font-semibold">API Tester</h1>
      </div>
    </nav>
  );
} 