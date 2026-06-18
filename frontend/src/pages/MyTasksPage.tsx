import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import taskApi from '../api/taskApi';
import type { Task } from '../types';
import { Inbox, Eye, AlertCircle, CheckSquare } from 'lucide-react';

export const MyTasksPage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await taskApi.getMy();
      if (res.success && res.data) {
        setTasks(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách task');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleClaim = async (id: string) => {
    try {
      const res = await taskApi.claim(id);
      if (res.success) {
        alert('Đã nhận task. Bạn có thể xử lý task này.');
        fetchTasks();
      }
    } catch (err: any) {
      alert(err.message || 'Không thể nhận task');
    }
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Inbox className="text-brand-500" size={32} />
          Hộp task của tôi
        </h2>
        <p className="text-slate-400 text-sm mt-1">Xem các task đang chờ, nhận xử lý, phê duyệt hoặc từ chối yêu cầu đặt phòng họp.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/15 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle />
          <span>{error}</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
          <Inbox className="mx-auto text-slate-700 mb-4" size={48} />
          <h3 className="text-lg font-bold text-white mb-1">Không có task chờ xử lý</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">Hiện không có yêu cầu đặt lịch họp nào đang chờ bạn nhận hoặc phê duyệt.</p>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">Mã task</th>
                <th className="py-4 px-6">Bước xử lý</th>
                <th className="py-4 px-6">Mã yêu cầu</th>
                <th className="py-4 px-6">Chủ đề họp</th>
                <th className="py-4 px-6">Thời điểm tạo</th>
                <th className="py-4 px-6 text-center">Trạng thái</th>
                <th className="py-4 px-6 text-center w-40">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-sm">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-900/25 transition-colors">
                  <td className="py-4 px-6 font-mono text-xs text-slate-400">{task.id.substring(0, 8)}...</td>
                  <td className="py-4 px-6 text-white font-semibold flex items-center gap-2">
                    <CheckSquare size={14} className="text-brand-400" />
                    <span>{task.name}</span>
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-brand-400 font-bold">{task.requestCode}</td>
                  <td className="py-4 px-6 text-slate-300 max-w-xs truncate" title={task.requestTitle}>{task.requestTitle}</td>
                  <td className="py-4 px-6 text-slate-400 text-xs">{formatDateTime(task.createdAt)}</td>
                  <td className="py-4 px-6 text-center">
                    {task.assignee ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                        Đã giao cho {task.assignee}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                        Chờ nhận task
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center flex items-center justify-center gap-2">
                    <button
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-3 rounded-xl text-xs transition-colors flex items-center gap-1.5 active:scale-95"
                    >
                      <Eye size={13} />
                      Chi tiết
                    </button>
                    {!task.assignee && (
                      <button
                        onClick={() => handleClaim(task.id)}
                        className="bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2 px-3 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-brand-500/10 active:scale-95"
                      >
                        Nhận task
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyTasksPage;
