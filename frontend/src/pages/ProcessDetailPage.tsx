import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import requestApi from '../api/requestApi';
import attendeeApi from '../api/attendeeApi';
import notificationApi from '../api/notificationApi';
import type { MeetingRequest, ProcessHistory, Notification } from '../types';
import { 
  ChevronLeft, 
  Clock, 
  User, 
  MessageSquare, 
  AlertCircle, 
  Video, 
  MapPin, 
  Check, 
  X, 
  Mail,
  UserCheck,
  CheckCircle,
  XCircle,
  HelpCircle,
  FileText
} from 'lucide-react';


export const ProcessDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const requestId = Number(id);

  const [request, setRequest] = useState<MeetingRequest | null>(null);
  const [history, setHistory] = useState<ProcessHistory[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tabs: 'attendees' | 'history' | 'notifications'
  const [activeTab, setActiveTab] = useState<'attendees' | 'history' | 'notifications'>('attendees');
  
  // Attendee response loading state
  const [responding, setResponding] = useState(false);

  // Countdown for hold timer
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  // Get current logged-in user
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const currentUserRoles: string[] = Array.isArray(currentUser?.roles) ? currentUser.roles : [];
  const currentUserEmail = typeof currentUser?.email === 'string' ? currentUser.email : '';
  const canViewProcessLogs = currentUserRoles.includes('ADMIN') || currentUserRoles.includes('APPROVER');

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const reqRes = await requestApi.getById(requestId);
      if (reqRes.success && reqRes.data) {
        setRequest(reqRes.data);
      }

      if (canViewProcessLogs) {
        const [histRes, notifRes] = await Promise.all([
          requestApi.getHistory(requestId),
          notificationApi.getMeetingNotifications(requestId)
        ]);
        if (histRes.success && histRes.data) {
          setHistory(histRes.data);
        }
        if (notifRes.success && notifRes.data) {
          setNotifications(notifRes.data);
        }
      } else {
        setHistory([]);
        setNotifications([]);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải chi tiết lịch họp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [requestId]);

  useEffect(() => {
    if (!canViewProcessLogs && activeTab !== 'attendees') {
      setActiveTab('attendees');
    }
  }, [canViewProcessLogs, activeTab]);

  // Hold Timer tick
  useEffect(() => {
    if (!request || request.status !== 'PENDING_APPROVAL' || !request.holdUntil) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const end = new Date(request.holdUntil!).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Hết hạn');
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [request]);

  const handleResponse = async (attendeeId: number, status: 'ACCEPTED' | 'DECLINED' | 'TENTATIVE') => {
    setResponding(true);
    try {
      const res = await attendeeApi.respondInternal(requestId, attendeeId, status);
      if (res.success) {
        alert(`Đã ghi nhận phản hồi: ${status}`);
        // Re-fetch details to update UI
        const reqRes = await requestApi.getById(requestId);
        if (reqRes.success && reqRes.data) {
          setRequest(reqRes.data);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Không thể gửi phản hồi');
    } finally {
      setResponding(false);
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

  const getAttendeeStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return <CheckCircle className="text-emerald-500" size={16} />;
      case 'DECLINED': return <XCircle className="text-red-500" size={16} />;
      case 'TENTATIVE': return <HelpCircle className="text-amber-500" size={16} />;
      default: return <Clock className="text-slate-500 animate-pulse" size={16} />;
    }
  };

  const getAttendeeStatusLabelClass = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'DECLINED': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'TENTATIVE': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default: return 'bg-slate-850 text-slate-400 border border-slate-800';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATED': return 'bg-slate-800 border-slate-700 text-slate-400';
      case 'ROOM_HELD': return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
      case 'APPROVAL_REQUESTED': return 'bg-amber-500/20 border-amber-500/30 text-amber-400';
      case 'APPROVED':
      case 'MEETING_CONFIRMED': return 'bg-emerald-500/20 border-emerald-500/30 text-green-400';
      case 'REJECTED': return 'bg-red-500/20 border-red-500/30 text-red-400';
      default: return 'bg-slate-800 border-slate-700 text-slate-400';
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

  const getHistoryComment = (event: ProcessHistory) => {
    switch (event.action) {
      case 'CREATED':
        return 'Tạo mới yêu cầu lịch họp';
      case 'ROOM_HELD':
        return 'Tạm giữ phòng họp thành công';
      case 'APPROVAL_REQUESTED':
        return 'Khởi chạy quy trình phê duyệt trên BPMN engine';
      case 'CLAIMED':
        return 'Đã nhận xử lý phê duyệt lịch họp';
      case 'ROOM_HOLD_EXPIRED':
        return 'Hết thời gian tạm giữ phòng. Yêu cầu đã bị từ chối và phòng đã được trả lại.';
      case 'MEETING_CONFIRMED':
        return 'Quy trình kết thúc: Cuộc họp được xác nhận thành công';
      case 'REJECTED':
        return 'Quy trình kết thúc: Cuộc họp bị từ chối';
      default:
        return event.comment;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="bg-red-500/15 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
        <AlertCircle />
        <span>{error || 'Không tìm thấy yêu cầu họp'}</span>
      </div>
    );
  }

  // Check if current user is an attendee
  const myAttendee = (currentUserEmail && request.attendees)
    ? request.attendees.find(a => a.attendeeEmail.toLowerCase() === currentUserEmail.toLowerCase())
    : null;

  // Compute stats
  const totalAttendees = request.attendees?.length || 0;
  const acceptedCount = request.attendees?.filter(a => a.responseStatus === 'ACCEPTED').length || 0;
  const declinedCount = request.attendees?.filter(a => a.responseStatus === 'DECLINED').length || 0;
  const tentativeCount = request.attendees?.filter(a => a.responseStatus === 'TENTATIVE').length || 0;
  const pendingCount = request.attendees?.filter(a => a.responseStatus === 'PENDING').length || 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <button 
          onClick={() => {
            if (currentUserRoles.includes('ADMIN')) {
              navigate('/dashboard');
            } else if (currentUserRoles.includes('APPROVER')) {
              navigate('/notifications');
            } else {
              navigate('/requests');
            }
          }}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-white mb-2 transition-colors"
        >
          <ChevronLeft size={16} />
          Quay lại danh sách
        </button>
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          Chi tiết lịch họp
        </h2>
        <p className="text-slate-400 text-sm mt-1">Theo dõi thông tin đặt lịch, phản hồi người tham gia và trạng thái quy trình của mã: <span className="font-mono text-xs text-brand-400 font-bold">{request.requestCode}</span></p>
      </div>

      {/* Direct Attendee Action Card */}
      {myAttendee && (
        <div className="bg-gradient-to-r from-brand-900/40 to-slate-900/60 backdrop-blur-xl border border-brand-500/30 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3">
            <UserCheck className="text-brand-400 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <h4 className="text-white font-bold text-sm">Bạn được mời tham gia cuộc họp này</h4>
              <p className="text-slate-300 text-xs mt-0.5">Vui lòng phản hồi khả năng tham gia. Trạng thái hiện tại: <span className="font-bold text-brand-300">{myAttendee.responseStatus}</span></p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleResponse(myAttendee.id, 'ACCEPTED')}
              disabled={responding || myAttendee.responseStatus === 'ACCEPTED'}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-850 disabled:text-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-emerald-500/10"
            >
              <Check size={14} /> Đồng ý
            </button>
            <button
              onClick={() => handleResponse(myAttendee.id, 'TENTATIVE')}
              disabled={responding || myAttendee.responseStatus === 'TENTATIVE'}
              className="bg-amber-600 hover:bg-amber-500 disabled:bg-amber-850 disabled:text-amber-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-amber-500/10"
            >
              <HelpCircle size={14} /> Có thể
            </button>
            <button
              onClick={() => handleResponse(myAttendee.id, 'DECLINED')}
              disabled={responding || myAttendee.responseStatus === 'DECLINED'}
              className="bg-red-600 hover:bg-red-500 disabled:bg-red-850 disabled:text-red-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-red-500/10"
            >
              <X size={14} /> Từ chối
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details and Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex justify-between items-start pb-3 border-b border-slate-800">
              <div>
                <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${
                  request.priority === 'HIGH' ? 'bg-red-500 animate-pulse' : request.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ưu tiên {request.priority}</span>
                <h3 className="text-2xl font-extrabold text-white mt-1">{request.title}</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadgeClass(request.status)}`}>
                {request.status === 'VALIDATION_FAILED' ? 'LỖI KIỂM TRA' : request.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Thời gian họp</p>
                <div className="text-white mt-1.5 font-semibold flex items-center gap-1.5">
                  <Clock size={14} className="text-brand-400" />
                  <span>{formatDateTime(request.startTime)}</span>
                  <span className="text-slate-500">&rarr;</span>
                  <span>{formatDateTime(request.endTime)}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Người tạo yêu cầu</p>
                <p className="text-white mt-1.5 font-bold flex items-center gap-1.5">
                  <User size={14} className="text-slate-400" />
                  <span>{request.createdBy}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Địa điểm / hình thức</p>
                <div className="text-white mt-1.5 flex items-center gap-1.5">
                  {request.meetingType === 'ONLINE' ? (
                    <>
                      <Video size={14} className="text-blue-400" />
                      <span className="text-xs text-blue-400 font-bold bg-blue-500/5 px-2 py-0.5 rounded-full">Họp online</span>
                    </>
                  ) : (
                    <>
                      <MapPin size={14} className="text-emerald-400" />
                      <span className="font-bold text-slate-200">{request.roomName} ({request.roomCode})</span>
                    </>
                  )}
                </div>
              </div>
              {request.onlineMeetingLink && (
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Link họp online</p>
                  <a 
                    href={request.onlineMeetingLink} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-brand-400 hover:text-brand-300 font-medium underline mt-1.5 block truncate"
                  >
                    {request.onlineMeetingLink}
                  </a>
                </div>
              )}
            </div>

            {request.equipments && request.equipments.length > 0 && (
              <div className="pt-4 border-t border-slate-800/80">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Thiết bị yêu cầu</p>
                <div className="flex flex-wrap gap-2">
                  {request.equipments?.map(eq => (
                    <span key={eq.id} className="text-xs bg-slate-950 border border-slate-800 text-slate-300 px-3 py-1 rounded-xl font-medium">
                      {eq.equipmentName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Nội dung / chương trình họp</p>
              <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl text-slate-300 text-sm mt-2 min-h-[80px] whitespace-pre-wrap">
                {request.meetingContent}
              </div>
            </div>

            {request.approvedBy && (
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl space-y-2">
                <p className="text-xs text-slate-500 uppercase font-semibold">Nhận xét phê duyệt</p>
                <div className="text-xs text-slate-300 flex items-center gap-1.5">
                  <User size={12} className="text-slate-400" />
                  <span>Được phê duyệt bởi <strong className="text-white font-semibold">{request.approvedBy}</strong></span>
                </div>
                {request.approverComment && (
                  <p className="text-slate-400 text-sm italic mt-1 bg-slate-900/50 p-2.5 rounded-xl border border-slate-900/50">
                    "{request.approverComment}"
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sub Panels Selector */}
          <div className="space-y-4">
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setActiveTab('attendees')}
                className={`py-3 px-6 text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'attendees' 
                    ? 'border-brand-500 text-white' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Phản hồi người tham gia ({acceptedCount}/{totalAttendees})
              </button>
              {canViewProcessLogs && (
                <>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`py-3 px-6 text-sm font-bold border-b-2 transition-all ${
                      activeTab === 'history' 
                        ? 'border-brand-500 text-white' 
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Lịch sử xử lý ({history.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`py-3 px-6 text-sm font-bold border-b-2 transition-all ${
                      activeTab === 'notifications' 
                        ? 'border-brand-500 text-white' 
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Nhật ký thông báo ({notifications.length})
                  </button>
                </>
              )}
            </div>

            {/* TAB: ATTENDEES */}
            {activeTab === 'attendees' && (
              <div className="space-y-4">
                {/* Stats Panel */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl text-center">
                    <p className="text-emerald-400 font-extrabold text-lg">{acceptedCount}</p>
                    <p className="text-slate-500 text-[10px] uppercase font-bold mt-0.5">Đồng ý</p>
                  </div>
                  <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-2xl text-center">
                    <p className="text-red-400 font-extrabold text-lg">{declinedCount}</p>
                    <p className="text-slate-500 text-[10px] uppercase font-bold mt-0.5">Từ chối</p>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-2xl text-center">
                    <p className="text-amber-400 font-extrabold text-lg">{tentativeCount}</p>
                    <p className="text-slate-500 text-[10px] uppercase font-bold mt-0.5">Có thể</p>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-850 p-3 rounded-2xl text-center">
                    <p className="text-slate-300 font-extrabold text-lg">{pendingCount}</p>
                    <p className="text-slate-500 text-[10px] uppercase font-bold mt-0.5">Chờ phản hồi</p>
                  </div>
                </div>

                {/* Attendees list */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-md">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-5">Tên / email</th>
                        <th className="py-3 px-5 text-center">Loại</th>
                        <th className="py-3 px-5 text-center">Trạng thái phản hồi</th>
                        <th className="py-3 px-5 text-right">Thời điểm phản hồi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-xs">
                      {request.attendees?.map(a => (
                        <tr key={a.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="py-3 px-5">
                            <p className="text-white font-bold">{a.attendeeName || 'Chưa có tên'}</p>
                            <p className="text-slate-500 text-[10px] mt-0.5">{a.attendeeEmail}</p>
                          </td>
                          <td className="py-3 px-5 text-center">
                            <span className={`inline-block font-bold text-[9px] px-1.5 py-0.5 rounded-full ${
                              a.attendeeType === 'INTERNAL' 
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {a.attendeeType}
                            </span>
                          </td>
                          <td className="py-3 px-5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {getAttendeeStatusIcon(a.responseStatus)}
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getAttendeeStatusLabelClass(a.responseStatus)}`}>
                                {a.responseStatus}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-5 text-right font-mono text-[10px] text-slate-400">
                            {a.respondedAt ? formatDateTime(a.respondedAt) : 'Chưa phản hồi'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: TIMELINE */}
            {canViewProcessLogs && activeTab === 'history' && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                {history.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">Chưa có sự kiện lịch sử nào được ghi nhận.</p>
                ) : (
                  <div className="relative pl-6 border-l border-slate-800 space-y-8 py-2">
                    {history.map((event, idx) => (
                      <div key={event.id || idx} className="relative">
                        <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center ${
                          event.action === 'APPROVED' || event.action === 'MEETING_CONFIRMED' ? 'bg-emerald-500' :
                          event.action === 'REJECTED' ? 'bg-red-500' :
                          event.action === 'ROOM_HELD' ? 'bg-blue-500' :
                          event.action === 'APPROVAL_REQUESTED' ? 'bg-amber-500' : 'bg-slate-600'
                        }`}></span>

                        <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 space-y-2">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${getActionColor(event.action)}`}>
                                {event.action}
                              </span>
                              {event.taskName && (
                                <span className="text-sm font-bold text-white">{event.taskName}</span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-semibold font-mono">
                              {formatDateTime(event.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <User size={13} className="text-slate-500" />
                            <span>Người thực hiện: <strong className="text-slate-300 font-semibold">{event.actor}</strong></span>
                            {event.oldStatus && event.newStatus && (
                              <span className="ml-2 pl-2 border-l border-slate-800">
                                Trạng thái: <span className="font-mono text-slate-500 text-[10px]">{event.oldStatus}</span> &rarr; <span className="font-mono text-brand-400 text-[10px]">{event.newStatus}</span>
                              </span>
                            )}
                          </div>

                          {getHistoryComment(event) && (
                            <div className="mt-2 text-xs text-slate-400 bg-slate-900/30 p-2.5 rounded-xl border border-slate-900/50 flex gap-2">
                              <MessageSquare size={13} className="text-slate-600 mt-0.5 flex-shrink-0" />
                              <span className="italic">"{getHistoryComment(event)}"</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: NOTIFICATIONS */}
            {canViewProcessLogs && activeTab === 'notifications' && (
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-10 bg-slate-900/40 border border-slate-800 rounded-3xl">Chưa gửi lời mời hoặc thông báo nào.</p>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl flex items-start justify-between gap-3 hover:border-slate-800 transition-all">
                      <div className="flex items-start gap-3 min-w-0">
                        <Mail className="text-slate-500 flex-shrink-0 mt-0.5" size={16} />
                        <div className="min-w-0">
                          <h4 className="text-white text-xs font-bold truncate">{notif.title}</h4>
                          <p className="text-slate-300 text-xs mt-1 leading-relaxed">{notif.message}</p>
                          <div className="flex gap-2 items-center mt-2 flex-wrap">
                            <span className="text-[9px] text-slate-400 font-mono">Gửi tới: {notif.recipientEmail || notif.recipientUsername}</span>
                            <span className="text-slate-700 text-[10px] font-bold">|</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              notif.recipientType === 'INTERNAL' 
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {notif.recipientType}
                            </span>
                            <span className="text-slate-700 text-[10px] font-bold">|</span>
                            <span className="text-[9px] text-slate-500 font-mono">{formatDateTime(notif.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        notif.status === 'SENT' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {notif.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Room Hold / Camunda Status Sidebar */}
        <div className="space-y-6">
          {/* Room Hold Timer Card */}
          {request.status === 'PENDING_APPROVAL' && timeLeft && (
            <div className="bg-gradient-to-br from-amber-950/20 to-slate-900/50 border border-amber-500/30 p-6 rounded-3xl shadow-xl flex flex-col items-center text-center space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
              <Clock className="text-amber-400 animate-pulse stroke-[1.5]" size={36} />
              <div>
                <h4 className="text-amber-400 font-extrabold text-sm uppercase tracking-wider">Tạm giữ phòng</h4>
                <p className="text-slate-400 text-xs mt-1">Cần phê duyệt yêu cầu trước khi thời gian giữ phòng hết hạn.</p>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-5 py-2 mt-2">
                <span className="text-2xl font-black font-mono text-white tracking-widest">{timeLeft}</span>
              </div>
            </div>
          )}

          {/* Camunda Engine Status Panel */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h4 className="font-bold text-white text-sm pb-2 border-b border-slate-850 flex items-center gap-1.5">
              <FileText size={16} className="text-slate-400" />
              Trạng thái workflow Camunda
            </h4>
            
            <div className="space-y-4 text-xs">
              <div>
                <p className="text-slate-500 font-semibold uppercase">Process Instance ID</p>
                <p className="text-slate-300 font-mono mt-0.5 break-all select-all bg-slate-950/60 p-2 rounded-xl border border-slate-850">
                  {request.processInstanceId || 'Chưa khởi chạy'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold uppercase">Workflow</p>
                <p className="text-slate-300 font-mono mt-0.5">{request.workflowName}</p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold uppercase">Ngày tạo yêu cầu</p>
                <p className="text-slate-300 mt-0.5">{formatDateTime(request.createdAt)}</p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold uppercase">Rest Endpoint</p>
                <p className="text-brand-400 font-mono mt-0.5 break-all">http://localhost:8080/engine-rest</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessDetailPage;
