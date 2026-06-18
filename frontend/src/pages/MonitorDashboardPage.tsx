import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import monitorApi from '../api/monitorApi';
import type { MeetingRequest, DashboardStats } from '../types';
import { BarChart3, Eye, CheckCircle2, XCircle, PlayCircle, AlertCircle, RefreshCw, Calendar, Video, MapPin } from 'lucide-react';

export const MonitorDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [processes, setProcesses] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, procRes] = await Promise.all([
        monitorApi.getStats(),
        monitorApi.getProcesses()
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (procRes.success && procRes.data) {
        setProcesses(procRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu giám sát');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-800 text-slate-400 border border-slate-700/50';
      case 'PENDING_APPROVAL': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'CONFIRMED': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'REJECTED': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'VALIDATION_FAILED': return 'bg-rose-950/20 text-rose-400 border border-rose-500/20';
      case 'CANCELLED': return 'bg-slate-900 text-slate-500 border border-slate-800';
      case 'FAILED': return 'bg-red-950/20 text-red-500 border border-red-500/20';
      default: return 'bg-slate-850 text-slate-400';
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="text-brand-500" size={32} />
            Giám sát quy trình họp
          </h2>
          <p className="text-slate-400 text-sm mt-1">Theo dõi giữ phòng, trạng thái xử lý và số liệu từ workflow engine.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold p-3 rounded-xl transition-all border border-slate-800 flex items-center gap-2 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle />
          <span>{error}</span>
        </div>
      )}

      {/* Aggregate Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng yêu cầu</p>
            <p className="text-3xl font-bold text-white mt-2">{stats.totalRequests}</p>
            <div className="absolute right-4 bottom-4 text-slate-700/30">
              <Calendar size={32} />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đang giữ phòng</p>
            <p className="text-3xl font-bold text-amber-400 mt-2">{stats.runningProcesses}</p>
            <div className="absolute right-4 bottom-4 text-amber-500/10">
              <PlayCircle size={32} />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đã xác nhận</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2">{stats.approvedRequests}</p>
            <div className="absolute right-4 bottom-4 text-emerald-500/10">
              <CheckCircle2 size={32} />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đã từ chối</p>
            <p className="text-3xl font-bold text-red-400 mt-2">{stats.rejectedRequests}</p>
            <div className="absolute right-4 bottom-4 text-red-500/10">
              <XCircle size={32} />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden col-span-2 lg:col-span-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lỗi / thất bại</p>
            <p className="text-3xl font-bold text-rose-500 mt-2">{stats.failedRequests}</p>
            <div className="absolute right-4 bottom-4 text-rose-500/10">
              <AlertCircle size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Process instance table list */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white tracking-wide">Danh sách process đã khởi chạy</h3>
        {loading && !stats ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : processes.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 border border-slate-850 rounded-3xl p-8">
            <AlertCircle className="mx-auto text-slate-700 mb-4" size={44} />
            <h4 className="text-white font-bold mb-1">Chưa có process nào</h4>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">Các yêu cầu đã khởi chạy workflow trên Camunda sẽ hiển thị tại đây.</p>
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Mã yêu cầu</th>
                  <th className="py-4 px-6">Chủ đề họp</th>
                  <th className="py-4 px-6">Người tạo</th>
                  <th className="py-4 px-6">Hình thức / địa điểm</th>
                  <th className="py-4 px-6">Thời gian</th>
                  <th className="py-4 px-6 text-center">Trạng thái</th>
                  <th className="py-4 px-6">Camunda Instance ID</th>
                  <th className="py-4 px-6 text-center w-28">Theo dõi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-sm">
                {processes.map((proc) => {
                  const isOnline = proc.meetingType === 'ONLINE';
                  return (
                    <tr key={proc.id} className="hover:bg-slate-900/25 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-brand-400 font-bold">{proc.requestCode}</td>
                      <td className="py-4 px-6 text-white font-semibold max-w-xs truncate" title={proc.title}>{proc.title}</td>
                      <td className="py-4 px-6 text-slate-300">{proc.createdBy}</td>
                      <td className="py-4 px-6 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          {isOnline ? (
                            <>
                              <Video size={13} className="text-blue-400" />
                              <span className="text-[10px] text-blue-400 font-bold bg-blue-500/5 px-2 py-0.5 rounded-full">Online</span>
                            </>
                          ) : (
                            <>
                              <MapPin size={13} className="text-emerald-400" />
                              <span className="font-semibold text-slate-200">{proc.roomName || 'Trực tiếp'}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-xs font-medium">
                        <div>Bắt đầu: {formatDateTime(proc.startTime)}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Kết thúc: {formatDateTime(proc.endTime)}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusBadgeClass(proc.status)}`}>
                          {proc.status === 'VALIDATION_FAILED' ? 'LỖI KIỂM TRA' : proc.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-500 select-all">
                        {proc.processInstanceId || 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => navigate(`/monitor/processes/${proc.id}`)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-3.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 mx-auto active:scale-95"
                        >
                          <Eye size={13} />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitorDashboardPage;
