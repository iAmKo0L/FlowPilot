import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import requestApi from '../api/requestApi';
import type { MeetingRequest } from '../types';
import { Calendar, Plus, Play, Eye, AlertCircle, Video, MapPin, Clock } from 'lucide-react';

export const RequestListPage: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await requestApi.getMy();
      if (res.success && res.data) {
        setRequests(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách yêu cầu họp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStartProcess = async (id: number) => {
    try {
      const res = await requestApi.start(id);
      if (res.success) {
        alert('Đã gửi yêu cầu họp. Phòng được tạm giữ và quy trình phê duyệt đã bắt đầu.');
        fetchRequests();
      }
    } catch (err: any) {
      alert(err.message || 'Không thể khởi chạy quy trình phê duyệt');
    }
  };

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
            <Calendar className="text-brand-500" size={32} />
            Lịch họp của tôi
          </h2>
          <p className="text-slate-400 text-sm mt-1">Tạo lịch họp mới, giữ phòng họp và theo dõi trạng thái xử lý.</p>
        </div>
        <button
          onClick={() => navigate('/requests/create')}
          className="bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-5 rounded-xl shadow-lg shadow-brand-600/25 transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus size={20} />
          Đặt lịch họp
        </button>
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
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
          <Calendar className="mx-auto text-slate-700 mb-4" size={48} />
          <h3 className="text-lg font-bold text-white mb-1">Chưa có lịch họp</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">Bạn chưa tạo yêu cầu họp nào. Nhấn Đặt lịch họp để bắt đầu.</p>
          <button
            onClick={() => navigate('/requests/create')}
            className="bg-brand-600/15 hover:bg-brand-600/25 border border-brand-500/30 text-brand-400 font-semibold py-2 px-4 rounded-xl text-sm transition-all"
          >
            Tạo lịch họp đầu tiên
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">Mã yêu cầu</th>
                <th className="py-4 px-6">Chủ đề họp</th>
                <th className="py-4 px-6">Hình thức / địa điểm</th>
                <th className="py-4 px-6"><Clock size={14} className="inline mr-1" /> Thời gian</th>
                <th className="py-4 px-6 text-center">Ưu tiên</th>
                <th className="py-4 px-6 text-center">Trạng thái</th>
                <th className="py-4 px-6 text-center w-36">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-sm">
              {requests.map((req) => {
                const isOnline = req.meetingType === 'ONLINE';
                const isHybrid = req.meetingType === 'HYBRID';
                
                return (
                  <tr key={req.id} className="hover:bg-slate-900/25 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-brand-400 font-bold">{req.requestCode}</td>
                    <td className="py-4 px-6 text-white font-semibold max-w-xs truncate" title={req.title}>{req.title}</td>
                    <td className="py-4 px-6 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        {isOnline ? (
                          <>
                            <Video size={14} className="text-blue-400" />
                            <span className="text-xs text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded-full font-bold">Online</span>
                          </>
                        ) : (
                          <>
                            <MapPin size={14} className="text-emerald-400" />
                            <span className="font-medium text-slate-200">{req.roomName || 'Trực tiếp'}</span>
                            {isHybrid && <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Hybrid</span>}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-xs font-medium">
                      <div>Bắt đầu: {formatDateTime(req.startTime)}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Kết thúc: {formatDateTime(req.endTime)}</div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                        req.priority === 'HIGH' ? 'bg-red-500' : req.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      <span className="text-xs text-slate-300 font-bold">{req.priority}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusBadgeClass(req.status)}`}>
                        {req.status === 'VALIDATION_FAILED' ? 'LỖI KIỂM TRA' : req.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => navigate(`/monitor/processes/${req.id}`)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold p-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                        title="Xem chi tiết lịch họp"
                      >
                        <Eye size={14} />
                      </button>
                      {req.status === 'DRAFT' && (
                        <button
                          onClick={() => handleStartProcess(req.id)}
                          className="bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/10 active:scale-95"
                          title="Gửi phê duyệt và tạm giữ phòng"
                        >
                          <Play size={12} fill="currentColor" />
                          Gửi duyệt
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RequestListPage;
