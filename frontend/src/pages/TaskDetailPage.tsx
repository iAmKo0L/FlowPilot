import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import taskApi from '../api/taskApi';
import requestApi from '../api/requestApi';
import type { Task, MeetingRequest } from '../types';
import { 
  ChevronLeft, 
  Check, 
  X, 
  Inbox, 
  AlertCircle, 
  MapPin, 
  Video, 
  Users, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Clock, 
  Layers
} from 'lucide-react';


export const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [meetingRequest, setMeetingRequest] = useState<MeetingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTaskDetails = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const res = await taskApi.getById(taskId);
      if (res.success && res.data) {
        setTask(res.data);
        try {
          const reqRes = await requestApi.getById(res.data.requestId);
          if (reqRes.success && reqRes.data) {
            setMeetingRequest(reqRes.data);
          }
        } catch (e) {
          console.error("Không thể tải chi tiết yêu cầu họp", e);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải chi tiết task');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const handleClaim = async () => {
    if (!task) return;
    try {
      const res = await taskApi.claim(task.id);
      if (res.success) {
        alert('Đã nhận task thành công.');
        fetchTaskDetails();
      }
    } catch (err: any) {
      alert(err.message || 'Không thể nhận task');
    }
  };

  const handleApprove = async () => {
    if (!task) return;
    setSubmitting(true);
    try {
      const res = await taskApi.approve(task.id, comment);
      if (res.success) {
        alert('Đã phê duyệt yêu cầu đặt lịch họp.');
        navigate('/tasks');
      }
    } catch (err: any) {
      alert(err.message || 'Không thể phê duyệt yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!task) return;
    setSubmitting(true);
    try {
      const res = await taskApi.reject(task.id, comment);
      if (res.success) {
        alert('Đã từ chối yêu cầu đặt lịch họp.');
        navigate('/tasks');
      }
    } catch (err: any) {
      alert(err.message || 'Không thể từ chối yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  const getAttendeeStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return <CheckCircle className="text-emerald-500" size={14} />;
      case 'DECLINED': return <XCircle className="text-red-500" size={14} />;
      case 'TENTATIVE': return <HelpCircle className="text-amber-500" size={14} />;
      default: return <Clock className="text-slate-500 animate-pulse" size={14} />;
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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="bg-red-500/15 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
        <AlertCircle />
        <span>{error || 'Không tìm thấy task'}</span>
      </div>
    );
  }

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { username: '' };
  const isAssignedToMe = task.assignee === user.username;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <button 
          onClick={() => navigate('/tasks')}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-white mb-2 transition-colors"
        >
          <ChevronLeft size={16} />
          Quay lại hộp task
        </button>
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Inbox className="text-brand-500" size={30} />
          {task.name}
        </h2>
        <p className="text-slate-400 text-sm mt-1">Camunda Task Instance: <span className="font-mono text-xs text-brand-400 select-all">{task.id}</span></p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meeting Request Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 space-y-5 shadow-xl">
            <h3 className="text-lg font-bold text-white pb-3 border-b border-slate-800">Thông tin yêu cầu đặt lịch</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Mã yêu cầu</p>
                <p className="text-white font-mono font-bold text-brand-400 mt-0.5">{task.requestCode}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Tiêu đề / chủ đề</p>
                <p className="text-white mt-0.5 font-bold">{task.requestTitle}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Người tạo yêu cầu</p>
                <p className="text-white mt-0.5">{meetingRequest?.createdBy || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Mức ưu tiên</p>
                <p className="text-white mt-0.5 font-semibold">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full mr-1.5 ${
                    meetingRequest?.priority === 'HIGH' ? 'bg-red-500' : meetingRequest?.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  {meetingRequest?.priority || 'MEDIUM'}
                </p>
              </div>

              {meetingRequest && (
                <>
                  <div className="col-span-2 pt-2 border-t border-slate-850">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Thời gian họp</p>
                    <div className="text-white font-semibold mt-1 flex items-center gap-1.5">
                      <Clock size={14} className="text-brand-400" />
                      <span>{formatDateTime(meetingRequest.startTime)}</span>
                      <span className="text-slate-500">&rarr;</span>
                      <span>{formatDateTime(meetingRequest.endTime)}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Địa điểm / hình thức</p>
                    <div className="text-white mt-1 flex items-center gap-1.5 font-medium">
                      {meetingRequest.meetingType === 'ONLINE' ? (
                        <>
                          <Video size={14} className="text-blue-400" />
                          <span className="text-xs text-blue-400 font-bold bg-blue-500/5 px-2 py-0.5 rounded-full">Họp online</span>
                        </>
                      ) : (
                        <>
                          <MapPin size={14} className="text-emerald-400" />
                          <span className="font-bold text-slate-200">{meetingRequest.roomName} ({meetingRequest.roomCode})</span>
                        </>
                      )}
                    </div>
                  </div>

                  {meetingRequest.onlineMeetingLink && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Link họp online</p>
                      <a href={meetingRequest.onlineMeetingLink} target="_blank" rel="noreferrer" className="text-brand-400 underline mt-1 block truncate">
                        {meetingRequest.onlineMeetingLink}
                      </a>
                    </div>
                  )}

                  {meetingRequest.equipments && meetingRequest.equipments.length > 0 && (
                    <div className="col-span-2 pt-2 border-t border-slate-850">
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Thiết bị yêu cầu</p>
                      <div className="flex flex-wrap gap-2">
                        {meetingRequest.equipments.map(eq => (
                          <span key={eq.id} className="text-xs bg-slate-950 border border-slate-800 text-slate-300 px-3 py-1 rounded-xl font-medium">
                            {eq.equipmentName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Nội dung / mô tả cuộc họp</p>
              <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl text-slate-300 text-sm mt-1.5 min-h-[80px] whitespace-pre-wrap">
                {task.content || 'Chưa có nội dung mô tả.'}
              </div>
            </div>

            {/* Attendees panel */}
            {meetingRequest && meetingRequest.attendees && (
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Users size={16} className="text-brand-400" />
                  Danh sách người tham gia ({meetingRequest.attendees.length})
                </h4>
                <div className="bg-slate-950/50 border border-slate-850 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-2.5 px-4">Tên / email</th>
                        <th className="py-2.5 px-4 text-center">Loại</th>
                        <th className="py-2.5 px-4 text-center">Phản hồi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-xs">
                      {meetingRequest.attendees.map(a => (
                        <tr key={a.id} className="hover:bg-slate-900/10">
                          <td className="py-2 px-4">
                            <p className="text-slate-200 font-bold">{a.attendeeName || 'Chưa có tên'}</p>
                            <p className="text-slate-500 text-[10px]">{a.attendeeEmail}</p>
                          </td>
                          <td className="py-2 px-4 text-center">
                            <span className="text-[9px] font-bold text-slate-400">{a.attendeeType}</span>
                          </td>
                          <td className="py-2 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {getAttendeeStatusIcon(a.responseStatus)}
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${getAttendeeStatusLabelClass(a.responseStatus)}`}>
                                {a.responseStatus}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Decision actions */}
          {isAssignedToMe ? (
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-white">Quyết định xử lý</h3>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Nhận xét / lý do phê duyệt hoặc từ chối</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-brand-500 h-24 resize-none text-sm"
                  placeholder="Nhập nhận xét hoặc lý do xử lý..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={submitting}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-600/10 disabled:opacity-50"
                >
                  <X size={18} />
                  Từ chối & trả phòng
                </button>
                <button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-600/10 disabled:opacity-50"
                >
                  <Check size={18} />
                  Xác nhận đặt phòng
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/25 text-amber-400 p-5 rounded-2xl text-sm flex flex-col items-start gap-4">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="flex-shrink-0" />
                <span>Bạn cần nhận task trước khi nhập nhận xét và đưa ra quyết định.</span>
              </div>
              <button
                onClick={handleClaim}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-amber-500/10 transition-all active:scale-95"
              >
                Nhận task ngay
              </button>
            </div>
          )}
        </div>

        {/* Task Meta details side bar */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 h-fit space-y-4 shadow-lg">
          <h4 className="font-bold text-white text-sm pb-2 border-b border-slate-800 flex items-center gap-1.5">
            <Layers size={14} className="text-slate-400" />
            Thông tin task
          </h4>
          
          <div className="space-y-3.5 text-xs">
            <div>
              <p className="text-slate-500 font-semibold uppercase">Camunda Step Key</p>
              <p className="text-slate-300 font-mono mt-0.5">{task.taskDefinitionKey}</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold uppercase">Thời điểm tạo</p>
              <p className="text-slate-300 mt-0.5">{formatDateTime(task.createdAt)}</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold uppercase">Nhóm có quyền xử lý</p>
              <p className="text-slate-300 mt-0.5">{task.candidateGroup || 'Không có'}</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold uppercase">Người đang xử lý</p>
              <p className="text-slate-300 mt-0.5">{task.assignee || 'Chưa có người nhận'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;
