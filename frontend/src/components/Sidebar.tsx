import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  Calendar,
  CheckSquare,
  ChevronsLeft,
  ChevronsRight,
  Compass,
  GitBranch,
  LogOut,
  Settings
} from 'lucide-react';

type NavItemProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
};

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, collapsed }) => (
  <NavLink
    to={to}
    title={collapsed ? label : undefined}
    className={({ isActive }) =>
      `flex items-center gap-3 rounded-xl transition-all duration-200 ${
        collapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'
      } ${
        isActive
          ? `bg-indigo-600/20 text-indigo-400 font-semibold ${collapsed ? '' : 'border-l-4 border-indigo-500 pl-3'}`
          : 'hover:bg-slate-800 hover:text-slate-100 text-slate-400'
      }`
    }
  >
    <span className="shrink-0">{icon}</span>
    {!collapsed && <span className="truncate">{label}</span>}
  </NavLink>
);

type SectionTitleProps = {
  children: React.ReactNode;
  collapsed: boolean;
};

const SectionTitle: React.FC<SectionTitleProps> = ({ children, collapsed }) => {
  if (collapsed) {
    return <div className="mx-auto my-3 h-px w-8 bg-slate-800" />;
  }

  return (
    <div className="px-3 pt-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
      {children}
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { username: 'guest', roles: [], fullName: 'Khách' };
  const roles: string[] = user.roles || [];

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  }, [collapsed]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const userInitials = (user.username || 'AD').substring(0, 2).toUpperCase();

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 flex flex-col min-h-screen text-slate-300 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className={`border-b border-slate-800 flex items-center ${collapsed ? 'justify-center p-4' : 'justify-between p-6'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
            <Compass size={22} className="animate-pulse" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-white tracking-wide text-lg truncate">FlowPilot</h1>
              <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Meetings v1.0</span>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className={`mx-4 mt-4 flex items-center rounded-xl border border-slate-800 bg-slate-950/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
          collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
        }`}
        title={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
      >
        {!collapsed && <span className="text-xs font-semibold">Thanh điều hướng</span>}
        {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
      </button>

      <nav className={`flex-1 space-y-1.5 ${collapsed ? 'p-3' : 'p-4'}`}>
        {roles.includes('ADMIN') && (
          <>
            <SectionTitle collapsed={collapsed}>Hệ thống</SectionTitle>
            <NavItem collapsed={collapsed} to="/admin/workflows" icon={<GitBranch size={18} />} label="Quy trình" />
            <NavItem collapsed={collapsed} to="/admin/rooms-equipment" icon={<Settings size={18} />} label="Phòng họp & thiết bị" />
            <NavItem collapsed={collapsed} to="/dashboard" icon={<BarChart3 size={18} />} label="Giám sát quy trình" />
            <NavItem collapsed={collapsed} to="/tasks" icon={<CheckSquare size={18} />} label="Task phê duyệt" />
          </>
        )}

        {roles.includes('REQUESTER') && (
          <>
            <SectionTitle collapsed={collapsed}>Người yêu cầu</SectionTitle>
            <NavItem collapsed={collapsed} to="/requests/create" icon={<Calendar size={18} />} label="Đặt lịch họp mới" />
            <NavItem collapsed={collapsed} to="/requests" icon={<CheckSquare size={18} />} label="Lịch họp của tôi" />
          </>
        )}

        {roles.includes('APPROVER') && (
          <>
            <SectionTitle collapsed={collapsed}>Người phê duyệt</SectionTitle>
            <NavItem collapsed={collapsed} to="/tasks" icon={<Calendar size={18} />} label="Yêu cầu cần duyệt" />
          </>
        )}

        {roles.length > 0 && (
          <>
            <SectionTitle collapsed={collapsed}>Cá nhân</SectionTitle>
            <NavItem collapsed={collapsed} to="/notifications" icon={<Bell size={18} />} label="Thông báo" />
          </>
        )}
      </nav>

      <div className={`border-t border-slate-800 bg-slate-950/40 ${collapsed ? 'p-3' : 'p-4'}`}>
        <div className={`flex items-center rounded-lg mb-3 ${collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}`}>
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold uppercase shrink-0">
            {userInitials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
              <p className="text-xs text-slate-500 truncate">{roles.join(', ')}</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? 'Đăng xuất' : undefined}
          className={`w-full flex items-center rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors duration-200 ${
            collapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'
          }`}
        >
          <LogOut size={18} />
          {!collapsed && <span className="font-semibold text-sm">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
