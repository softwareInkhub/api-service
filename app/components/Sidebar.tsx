'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiCode, FiDatabase, FiLayers, FiGrid } from 'react-icons/fi';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Activity Service',
      href: '/activity-tester',
      icon: <FiLayers />,
      description: 'Test activities'
    },
    {
      name: 'API Service',
      href: '/api-tester',
      icon: <FiCode />,
      description: 'Test API endpoints'
    },
    {
      name: 'Namespace Service',
      href: '/namespace-management',
      icon: <FiDatabase />,
      description: 'Manage API namespaces'
    },
    {
      name: 'Schema Service',
      href: '/schema-service',
      icon: <FiGrid />,
      description: 'Manage data schemas'
    },
   

  ];

  return (
    <div className="w-64 h-screen bg-white border-r flex flex-col fixed left-0 top-0">
      {/* Logo/Header */}
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gray-800">API Tools</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-[#ff6b4a] text-white' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className={`${isActive ? 'text-white' : 'text-gray-400'}`}>
                  {item.icon}
                </span>
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className={`text-xs ${
                    isActive ? 'text-white/80' : 'text-gray-500'
                  }`}>
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="text-xs text-gray-500">
          Version 1.0.0
        </div>
      </div>
    </div>
  );
} 