import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export const Layout: React.FC = () => {
  return (
    <div className="flex bg-slate-950 min-h-screen text-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto h-screen p-8 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
