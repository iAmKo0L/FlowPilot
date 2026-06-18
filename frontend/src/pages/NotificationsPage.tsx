import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import attendeeApi from '../api/attendeeApi';
import { notificationApi } from '../api/notificationApi';
import requestApi from '../api/requestApi';
import type { Notification } from '../types';
import { Bell, Check, Eye, Inbox, X } from 'lucide-react';

const typeLabels: Record<string, string> = {
  APPROVAL_REQUEST: 'Yêu cầu phê duyệt',
  APPROVED: 'Đã phê duyệt',
  REJECTED: 'Đã từ chối',
  INVITATION: 'Lời mời họp',
  INFO: 'Thông tin'
};

const statusLabels: Record<string, string> = {
  SENT: 'Đã gửi',
  READ: 'Đã đọc',
  ACCEPTED: 'Đã đồng ý',
  DECLINED: 'Đã từ chối',
  TENTATIVE: 'Có thể tham gia'
};

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userString = localStorage.getItem('user');
  const currentUser = userString ? JSON.parse(userString) : null;
  const currentUserEmail = typeof currentUser?.email === 'string' ? currentUser.email.toLowerCase() : '';

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationApi.getMy();
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const respondInvitation = async (notification: Notification, responseStatus: 'ACCEPTED' | 'DECLINED') => {
    if (!notification.meetingRequestId) return;
    if (!currentUserEmail) {
      alert('Tài khoản hiện tại chưa có email. Vui lòng đăng xuất rồi đăng nhập lại.');
      return;
    }

    setRespondingId(notification.id);
    try {
      const meetingRes = await requestApi.getById(notification.meetingRequestId);
      if (!meetingRes.success || !meetingRes.data) {
        throw new Error('Không tải được thông tin cuộc họp');
      }

      const attendee = meetingRes.data.attendees?.find((item) => item.attendeeEmail.toLowerCase() === currentUserEmail);
      if (!attendee) {
        throw new Error('Không tìm thấy lời mời họp ứng với email của tài khoản này');
      }
      if (attendee.attendeeType !== 'INTERNAL') {
        throw new Error('Lời mời này không thuộc người tham gia nội bộ');
      }

      const response = await attendeeApi.respondInternal(notification.meetingRequestId, attendee.id, responseStatus);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((item) => item.id === notification.id ? { ...item, status: responseStatus } : item)
        );
        alert(responseStatus === 'ACCEPTED' ? 'Đã đồng ý tham gia cuộc họp' : 'Đã từ chối tham gia cuộc họp');
        loadNotifications();
      }
    } catch (err: any) {
      alert(err.message || 'Không thể phản hồi lời mời họp');
    } finally {
      setRespondingId(null);
    }
  };

  const getTypeClass = (type: string) => {
    switch (type) {
      case 'APPROVAL_REQUEST':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'INVITATION':
        return 'bg-brand-500/10 text-brand-400 border-brand-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Bell className="text-brand-500" size={32} />
          Thông báo của tôi
        </h2>
        <p className="text-slate-400 text-sm mt-1">Lời mời họp, kết quả phê duyệt và các cập nhật từ quy trình.</p>
      </div>

      {error && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-14 text-center text-slate-500">
          <Inbox className="mx-auto mb-4 text-slate-700" size={48} />
          <p className="font-semibold">Chưa có thông báo nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((noti) => {
            const isInvitation = noti.type === 'INVITATION' && noti.meetingRequestId;
            const hasResponded = ['ACCEPTED', 'DECLINED', 'TENTATIVE'].includes(noti.status);
            const disabled = respondingId === noti.id;

            return (
              <div key={noti.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase ${getTypeClass(noti.type)}`}>
                      {typeLabels[noti.type] || noti.type}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(noti.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <h3 className="font-bold text-white">{noti.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{noti.message}</p>
                  <p className="text-[10px] text-slate-600 font-mono">
                    Người nhận: {noti.recipientEmail || noti.recipientUsername || 'Không có dữ liệu'}
                  </p>
                  {isInvitation && hasResponded && (
                    <span className={`inline-flex mt-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase ${
                      noti.status === 'ACCEPTED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : noti.status === 'DECLINED'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      Phản hồi: {statusLabels[noti.status] || noti.status}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap md:flex-col gap-2 md:min-w-36">
                  {noti.meetingRequestId && (
                    <button
                      onClick={() => navigate(`/monitor/processes/${noti.meetingRequestId}`)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5"
                    >
                      <Eye size={14} />
                      Xem chi tiết
                    </button>
                  )}

                  {isInvitation && !hasResponded && (
                    <>
                      <button
                        onClick={() => respondInvitation(noti, 'ACCEPTED')}
                        disabled={disabled}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <Check size={14} />
                        Đồng ý
                      </button>
                      <button
                        onClick={() => respondInvitation(noti, 'DECLINED')}
                        disabled={disabled}
                        className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <X size={14} />
                        Từ chối
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
