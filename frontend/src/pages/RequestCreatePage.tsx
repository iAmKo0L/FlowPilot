import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import requestApi from '../api/requestApi';
import { roomApi } from '../api/roomApi';
import userApi from '../api/userApi';
import workflowApi from '../api/workflowApi';
import type { AttendeeResolveResult } from '../api/userApi';
import type { MeetingRoom, WorkflowDefinition } from '../types';
import { 
  ChevronLeft, 
  AlertCircle, 
  Video, 
  MapPin, 
  Layers, 
  UserPlus, 
  Trash2, 
  Users, 
  Calendar,
  Briefcase
} from 'lucide-react';


export const RequestCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [meetingContent, setMeetingContent] = useState('');
  const [meetingType, setMeetingType] = useState<'ONLINE' | 'OFFLINE' | 'HYBRID'>('OFFLINE');
  const [onlineMeetingLink, setOnlineMeetingLink] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedEquipments, setSelectedEquipments] = useState<number[]>([]);
  
  // Attendee state
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [attendees, setAttendees] = useState<AttendeeResolveResult[]>([]);
  const [resolvingAttendee, setResolvingAttendee] = useState(false);
  
  // User search suggestion state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch active rooms
  useEffect(() => {
    const fetchRooms = async () => {
      setLoadingRooms(true);
      try {
        const res = await roomApi.getAll();
        if (res.success && res.data) {
          const activeRooms = res.data.filter((r: MeetingRoom) => r.status === 'ACTIVE');
          setRooms(activeRooms);
          if (activeRooms.length > 0) {
            setSelectedRoomId(String(activeRooms[0].id));
          }
        }
      } catch (err: any) {
        setError(err.message || 'Không thể tải danh sách phòng họp');
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const res = await workflowApi.getAvailable();
        if (res.success && res.data) {
          setWorkflows(res.data);
          if (res.data.length > 0) {
            setSelectedWorkflowId(String(res.data[0].id));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchWorkflows();
  }, []);

  // Search users for suggestion
  useEffect(() => {
    if (searchKeyword.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await userApi.search(searchKeyword);
        if (res.success && res.data) {
          setSearchResults(res.data);
        }
      } catch (e) {
        console.error(e);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchKeyword]);

  // Update equipment checklist when selected room changes
  const activeRoom = rooms.find(r => String(r.id) === selectedRoomId);
  useEffect(() => {
    setSelectedEquipments([]);
  }, [selectedRoomId]);

  const handleAddAttendeeEmail = async (emailStr: string) => {
    const email = emailStr.trim().toLowerCase();
    if (!email) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    if (attendees.some(a => a.email === email)) {
      alert('Email này đã có trong danh sách người tham gia.');
      return;
    }

    setResolvingAttendee(true);
    try {
      const res = await userApi.resolve([email]);
      if (res.success && res.data && res.data.length > 0) {
        const resolved = res.data[0];
        setAttendees(prev => [...prev, resolved]);
        setAttendeeEmail('');
        setSearchKeyword('');
        setShowSuggestions(false);
      }
    } catch (err: any) {
      alert(err.message || 'Không thể kiểm tra email người tham gia');
    } finally {
      setResolvingAttendee(false);
    }
  };

  const handleRemoveAttendee = (email: string) => {
    setAttendees(prev => prev.filter(a => a.email !== email));
  };

  const handleEquipmentToggle = (eqId: number) => {
    setSelectedEquipments(prev => 
      prev.includes(eqId) ? prev.filter(id => id !== eqId) : [...prev, eqId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Vui lòng nhập tiêu đề cuộc họp');
      return;
    }
    if (!meetingContent.trim()) {
      setFormError('Vui lòng nhập nội dung hoặc chương trình họp');
      return;
    }
    if (!startTime || !endTime) {
      setFormError('Vui lòng chọn thời gian bắt đầu và kết thúc');
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      setFormError('Thời gian bắt đầu phải trước thời gian kết thúc');
      return;
    }
    if (meetingType !== 'ONLINE' && !selectedRoomId) {
      setFormError('Cuộc họp trực tiếp hoặc kết hợp cần chọn phòng họp');
      return;
    }
    if (meetingType !== 'ONLINE' && activeRoom && attendees.length > activeRoom.capacity) {
      setFormError(`Phòng đã chọn có sức chứa ${activeRoom.capacity}, nhưng bạn đã thêm ${attendees.length} người tham gia`);
      return;
    }
    if ((meetingType === 'ONLINE' || meetingType === 'HYBRID') && !onlineMeetingLink.trim()) {
      setFormError('Cuộc họp online hoặc kết hợp cần nhập link họp');
      return;
    }
    if (attendees.length === 0) {
      setFormError('Vui lòng thêm ít nhất một người tham gia');
      return;
    }
    if (!selectedWorkflowId) {
      setFormError('Vui lòng chọn một workflow đã deploy');
      return;
    }

    setLoading(true);
    try {
      const formattedAttendees = attendees.map(a => ({
        email: a.email,
        name: a.name || a.email.split('@')[0]
      }));

      const payload = {
        workflowId: Number(selectedWorkflowId),
        title: title.trim(),
        meetingContent: meetingContent.trim(),
        meetingType,
        onlineMeetingLink: (meetingType === 'ONLINE' || meetingType === 'HYBRID') ? onlineMeetingLink.trim() : undefined,
        startTime: startTime.length === 16 ? `${startTime}:00` : startTime, // YYYY-MM-DDTHH:mm:ss
        endTime: endTime.length === 16 ? `${endTime}:00` : endTime,
        roomId: meetingType !== 'ONLINE' ? Number(selectedRoomId) : undefined,
        equipmentIds: meetingType !== 'ONLINE' ? selectedEquipments : [],
        priority,
        attendees: formattedAttendees
      };

      const res = await requestApi.create(payload);
      if (res.success && res.data) {
        // Automatically start approval process to hold room
        const startRes = await requestApi.start(res.data.id);
        if (startRes.success) {
          alert('Đã gửi yêu cầu họp và khởi chạy phê duyệt. Phòng được tạm giữ trong 15 phút.');
        } else {
          alert('Đã lưu bản nháp, nhưng không thể tự động khởi chạy quy trình phê duyệt.');
        }
        navigate('/requests');
      }
    } catch (err: any) {
      setFormError(err.message || 'Không thể gửi yêu cầu họp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <button 
          onClick={() => navigate('/requests')}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-white mb-2 transition-colors"
        >
          <ChevronLeft size={16} />
          Quay lại danh sách
        </button>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Đặt lịch phòng họp</h2>
        <p className="text-slate-400 text-sm mt-1">Chọn phòng, thiết bị, người tham gia và khởi chạy luồng phê duyệt.</p>
      </div>

      {formError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex gap-2">
          <AlertCircle className="flex-shrink-0" size={18} />
          <span>{formError}</span>
        </div>
      )}

      {loadingRooms ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/15 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle />
          <span>{error}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Calendar size={18} className="text-brand-400" />
                Thông tin cuộc họp
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Tiêu đề cuộc họp *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-brand-500 transition-colors"
                    placeholder="Ví dụ: Đồng bộ dự án FlowPilot"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Workflow phê duyệt *</label>
                  {workflows.length === 0 ? (
                    <div className="text-amber-500 text-sm bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl">
                      Chưa có workflow đã deploy. Vui lòng yêu cầu admin deploy workflow trước.
                    </div>
                  ) : (
                    <select
                      required
                      value={selectedWorkflowId}
                      onChange={(e) => setSelectedWorkflowId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors text-sm"
                    >
                      {workflows.map((workflow) => (
                        <option key={workflow.id} value={workflow.id}>
                          {workflow.name} ({workflow.bpmnProcessKey || workflow.code})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Nội dung / chương trình họp *</label>
                  <textarea
                    required
                    value={meetingContent}
                    onChange={(e) => setMeetingContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-brand-500 h-28 resize-none transition-colors"
                    placeholder="Nhập nội dung hoặc chương trình cuộc họp..."
                  />
                </div>

                {/* Priority Cards */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Mức ưu tiên</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => {
                      const isActive = priority === p;
                      const activeStyles = {
                        LOW: 'border-blue-500/50 bg-blue-500/5 text-blue-400 shadow-md shadow-blue-500/5',
                        MEDIUM: 'border-amber-500/50 bg-amber-500/5 text-amber-400 shadow-md shadow-amber-500/5',
                        HIGH: 'border-red-500/50 bg-red-500/5 text-red-400 shadow-md shadow-red-500/5',
                      }[p];
                      
                      return (
                        <button
                          type="button"
                          key={p}
                          onClick={() => setPriority(p)}
                          className={`border rounded-xl p-3 text-sm font-semibold text-center transition-all ${
                            isActive ? activeStyles : 'border-slate-800 bg-slate-950/40 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Thời gian bắt đầu *</label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        onClick={(e) => e.currentTarget.showPicker?.()}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Thời gian kết thúc *</label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        onClick={(e) => e.currentTarget.showPicker?.()}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Briefcase size={18} className="text-brand-400" />
                Phòng họp & kết nối
              </h3>

              {/* Meeting Type Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Hình thức họp</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { type: 'ONLINE', icon: Video, label: 'Online' },
                      { type: 'OFFLINE', icon: MapPin, label: 'Trực tiếp' },
                      { type: 'HYBRID', icon: Layers, label: 'Kết hợp' }
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = meetingType === item.type;
                      return (
                        <button
                          type="button"
                          key={item.type}
                          onClick={() => setMeetingType(item.type as any)}
                          className={`flex flex-col items-center gap-2 border rounded-xl p-4 text-center transition-all ${
                            isActive 
                              ? 'border-brand-500/50 bg-brand-500/5 text-brand-400 shadow-md shadow-brand-500/5' 
                              : 'border-slate-800 bg-slate-950/40 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <Icon size={20} />
                          <span className="text-xs font-bold">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Online Link */}
                {(meetingType === 'ONLINE' || meetingType === 'HYBRID') && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Link họp online *</label>
                    <input
                      type="url"
                      required
                      value={onlineMeetingLink}
                      onChange={(e) => setOnlineMeetingLink(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-brand-500 transition-colors"
                      placeholder="Ví dụ: https://meet.google.com/abc-defg-hij"
                    />
                  </div>
                )}

                {/* Room Selector */}
                {meetingType !== 'ONLINE' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Chọn phòng họp *</label>
                      {rooms.length === 0 ? (
                        <div className="text-amber-500 text-sm bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl">
                          Không có phòng đang hoạt động.
                        </div>
                      ) : (
                        <select
                          value={selectedRoomId}
                          onChange={(e) => setSelectedRoomId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors text-sm"
                        >
                          {rooms.map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.roomName} ({room.location || 'Chưa có vị trí'}, sức chứa: {room.capacity})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Equipment Checklist */}
                    {activeRoom && (
                      <div className="md:col-span-1">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Thiết bị yêu cầu</label>
                        {activeRoom.equipments.length === 0 ? (
                          <div className="text-slate-600 text-xs py-2">Phòng này chưa có thiết bị.</div>
                        ) : (
                          <div className="space-y-2 border border-slate-800/80 bg-slate-950 rounded-xl p-3 max-h-32 overflow-y-auto">
                            {activeRoom.equipments.map((eq) => {
                              const checked = selectedEquipments.includes(eq.id);
                              return (
                                <label key={eq.id} className="flex items-center gap-2 text-slate-300 text-xs font-semibold cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleEquipmentToggle(eq.id)}
                                    className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-brand-500 focus:ring-brand-500"
                                  />
                                  <span>{eq.equipmentName}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attendees List Side panel */}
          <div className="space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-6 flex flex-col h-[520px]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3 flex-shrink-0">
                <Users size={18} className="text-brand-400" />
                Người tham gia ({attendees.length})
              </h3>

              {/* Attendee Input with search suggestions */}
              <div className="space-y-2 relative flex-shrink-0">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Tìm người dùng hoặc nhập email</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchKeyword}
                      onChange={(e) => {
                        setSearchKeyword(e.target.value);
                        setAttendeeEmail(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-700 focus:outline-none focus:border-brand-500 text-sm"
                      placeholder="Nhập tên hoặc email..."
                    />
                    
                    {/* Suggestions list */}
                    {showSuggestions && searchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-800 rounded-xl max-h-40 overflow-y-auto z-55 shadow-2xl">
                        {searchResults.map((user) => (
                          <button
                            type="button"
                            key={user.id}
                            onClick={() => handleAddAttendeeEmail(user.email)}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-850 text-white flex flex-col gap-0.5 border-b border-slate-900 last:border-0"
                          >
                            <span className="font-semibold">{user.fullName}</span>
                            <span className="text-slate-500 text-[10px]">{user.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={resolvingAttendee}
                    onClick={() => handleAddAttendeeEmail(attendeeEmail)}
                    className="bg-slate-850 hover:bg-slate-800 text-white border border-slate-800 rounded-xl px-3 flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <UserPlus size={16} />
                  </button>
                </div>
              </div>

              {/* Attendees scroll container */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                {attendees.length === 0 ? (
                  <div className="text-slate-600 text-sm text-center py-10 flex flex-col items-center gap-2">
                    <Users size={32} className="stroke-[1.5]" />
                    <span>Chưa thêm người tham gia.</span>
                  </div>
                ) : (
                  attendees.map((attendee) => {
                    const isInternal = attendee.type === 'INTERNAL';
                    return (
                      <div 
                        key={attendee.email} 
                        className="bg-slate-950 border border-slate-850/80 hover:border-slate-800 p-3 rounded-xl flex items-center justify-between transition-all group"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-white text-xs font-bold truncate">
                            {attendee.name || attendee.email.split('@')[0]}
                          </p>
                          <p className="text-slate-500 text-[10px] truncate">{attendee.email}</p>
                          <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            isInternal 
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {isInternal ? 'Nội bộ' : 'Khách'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttendee(attendee.email)}
                          className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/requests')}
                className="flex-1 bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-300 font-semibold py-3 px-4 rounded-2xl text-sm transition-all"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-4 rounded-2xl text-sm shadow-lg shadow-brand-600/20 transition-all disabled:opacity-50"
              >
                {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default RequestCreatePage;
