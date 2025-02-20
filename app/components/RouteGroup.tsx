'use client';

import { useState } from 'react';
import { RouteConfig, ApiResponse } from 'app/types/route';
import RouteTest from './RouteTest';

interface RouteGroupProps {
  title: string;
  routes: RouteConfig[];
}

export default function RouteGroup({ title, routes }: RouteGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border rounded-lg overflow-hidden mb-4">
      <button
        className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-left font-semibold flex justify-between items-center"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>{title}</span>
        <span>{isExpanded ? '▼' : '▶'}</span>
      </button>
      
      {isExpanded && (
        <div className="p-4 space-y-4">
          {routes.map((route) => (
            <RouteTest key={`${route.method}-${route.path}`} route={route} />
          ))}
        </div>
      )}
    </div>
  );
} 