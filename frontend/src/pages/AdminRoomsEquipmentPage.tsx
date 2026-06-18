import React, { useEffect, useState } from 'react';
import { roomApi, equipmentApi } from '../api/roomApi';
import type { MeetingRoom, Equipment } from '../types';
import { 
  Building, 
  Layers, 
  Settings, 
  Trash2, 
  Edit2, 
  Plus, 
  AlertCircle
} from 'lucide-react';

export const AdminRoomsEquipmentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'equipment'>('rooms');
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<MeetingRoom | null>(null);
  const [roomForm, setRoomForm] = useState({
    roomCode: '',
    roomName: '',
    location: '',
    capacity: 10,
    status: 'ACTIVE',
    description: '',
    equipmentIds: [] as number[],
  });

  const [eqModalOpen, setEqModalOpen] = useState(false);
  const [selectedEq, setSelectedEq] = useState<Equipment | null>(null);
  const [eqForm, setEqForm] = useState({
    equipmentCode: '',
    equipmentName: '',
    status: 'ACTIVE',
    description: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rRes, eRes] = await Promise.all([roomApi.getAll(), equipmentApi.getAll()]);
      if (rRes.success) setRooms(rRes.data);
      if (eRes.success) setEquipments(eRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách phòng họp và thiết bị.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Room handlers
  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...roomForm,
        equipmentIds: roomForm.equipmentIds,
      };
      let res;
      if (selectedRoom) {
        res = await roomApi.update(selectedRoom.id, payload);
      } else {
        res = await roomApi.create(payload);
      }
      if (res.success) {
        setRoomModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể lưu thông tin phòng họp');
    }
  };

  const handleEditRoom = (room: MeetingRoom) => {
    setSelectedRoom(room);
    setRoomForm({
      roomCode: room.roomCode,
      roomName: room.roomName,
      location: room.location || '',
      capacity: room.capacity,
      status: room.status,
      description: room.description || '',
      equipmentIds: room.equipments.map((e) => e.id),
    });
    setRoomModalOpen(true);
  };

  const handleDeleteRoom = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa phòng họp này?')) return;
    try {
      const res = await roomApi.delete(id);
      if (res.success) loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa phòng họp');
    }
  };

  const openNewRoomModal = () => {
    setSelectedRoom(null);
    setRoomForm({
      roomCode: '',
      roomName: '',
      location: '',
      capacity: 10,
      status: 'ACTIVE',
      description: '',
      equipmentIds: [],
    });
    setRoomModalOpen(true);
  };

  // Equipment handlers
  const handleEqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (selectedEq) {
        res = await equipmentApi.update(selectedEq.id, eqForm);
      } else {
        res = await equipmentApi.create(eqForm);
      }
      if (res.success) {
        setEqModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể lưu thiết bị');
    }
  };

  const handleEditEq = (eq: Equipment) => {
    setSelectedEq(eq);
    setEqForm({
      equipmentCode: eq.equipmentCode,
      equipmentName: eq.equipmentName,
      status: eq.status,
      description: eq.description || '',
    });
    setEqModalOpen(true);
  };

  const handleDeleteEq = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa thiết bị này?')) return;
    try {
      const res = await equipmentApi.delete(id);
      if (res.success) loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa thiết bị');
    }
  };

  const openNewEqModal = () => {
    setSelectedEq(null);
    setEqForm({
      equipmentCode: '',
      equipmentName: '',
      status: 'ACTIVE',
      description: '',
    });
    setEqModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Building className="text-brand-500" size={32} />
            Quản lý phòng họp & thiết bị
          </h2>
          <p className="text-slate-400 text-sm mt-1">Cấu hình phòng họp, sức chứa và các thiết bị dùng trong hệ thống FlowPilot.</p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/80 shadow-inner">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'rooms' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Phòng họp
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'equipment' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Thiết bị
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : activeTab === 'rooms' ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-brand-400" />
              Danh mục phòng họp
            </h3>
            <button
              onClick={openNewRoomModal}
              className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-brand-600/10 hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Plus size={14} /> Thêm phòng
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/20 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <th className="px-6 py-4">Mã phòng</th>
                  <th className="px-6 py-4">Tên phòng</th>
                  <th className="px-6 py-4">Vị trí</th>
                  <th className="px-6 py-4 text-center">Sức chứa</th>
                  <th className="px-6 py-4">Thiết bị</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right w-36">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-sm">
                {rooms.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 bg-slate-900/10">
                      Chưa có phòng họp nào. Nhấn Thêm phòng để tạo mới.
                    </td>
                  </tr>
                ) : (
                  rooms.map((room) => (
                    <tr key={room.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-brand-400">{room.roomCode}</td>
                      <td className="px-6 py-4 font-bold text-white">{room.roomName}</td>
                      <td className="px-6 py-4 text-slate-350 text-xs">{room.location || 'Chưa có'}</td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-200">{room.capacity} người</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {room.equipments.map((eq) => (
                            <span
                              key={eq.id}
                              className="bg-brand-500/5 border border-brand-500/10 text-brand-400 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase"
                            >
                              {eq.equipmentName}
                            </span>
                          ))}
                          {room.equipments.length === 0 && <span className="text-slate-600 text-xs italic">Không có</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                            room.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : room.status === 'MAINTENANCE'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700/50'
                          }`}
                        >
                          {room.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEditRoom(room)}
                            className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold p-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 active:scale-95"
                            title="Sửa"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="bg-slate-850 hover:bg-red-500/10 text-slate-400 hover:text-red-400 p-2 rounded-lg transition-colors flex items-center justify-center gap-1 active:scale-95"
                            title="Xóa"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings size={18} className="text-brand-400" />
              Danh mục thiết bị
            </h3>
            <button
              onClick={openNewEqModal}
              className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-brand-600/10 hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Plus size={14} /> Thêm thiết bị
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/20 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <th className="px-6 py-4">Mã thiết bị</th>
                  <th className="px-6 py-4">Tên thiết bị</th>
                  <th className="px-6 py-4">Mô tả</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right w-36">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-sm">
                {equipments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 bg-slate-900/10">
                      Chưa có thiết bị nào. Nhấn Thêm thiết bị để tạo mới.
                    </td>
                  </tr>
                ) : (
                  equipments.map((eq) => (
                    <tr key={eq.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-brand-400">{eq.equipmentCode}</td>
                      <td className="px-6 py-4 font-bold text-white">{eq.equipmentName}</td>
                      <td className="px-6 py-4 text-slate-350 text-xs">{eq.description || 'Chưa có'}</td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                            eq.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700/50'
                          }`}
                        >
                          {eq.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEditEq(eq)}
                            className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold p-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 active:scale-95"
                            title="Sửa"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteEq(eq.id)}
                            className="bg-slate-850 hover:bg-red-500/10 text-slate-400 hover:text-red-400 p-2 rounded-lg transition-colors flex items-center justify-center gap-1 active:scale-95"
                            title="Xóa"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {roomModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                {selectedRoom ? 'Cập nhật phòng họp' : 'Thêm phòng họp'}
              </h3>
              <button 
                onClick={() => setRoomModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleRoomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Mã phòng *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: ROOM_A101"
                  value={roomForm.roomCode}
                  onChange={(e) => setRoomForm({ ...roomForm, roomCode: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none focus:border-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Tên phòng *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phòng họp tầng 1"
                  value={roomForm.roomName}
                  onChange={(e) => setRoomForm({ ...roomForm, roomName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none focus:border-brand-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Vị trí</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Tầng 1 - Tòa A"
                    value={roomForm.location}
                    onChange={(e) => setRoomForm({ ...roomForm, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Sức chứa *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) || 10 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Mô tả phòng</label>
                <textarea
                  placeholder="Ví dụ: Phù hợp cho các cuộc họp quan trọng..."
                  value={roomForm.description}
                  onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none focus:border-brand-500 h-20 resize-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Thiết bị gắn với phòng</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-slate-800/80 rounded-xl p-3 bg-slate-950">
                  {equipments.map((eq) => {
                    const isChecked = roomForm.equipmentIds.includes(eq.id);
                    return (
                      <label key={eq.id} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300 select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const newIds = e.target.checked
                              ? [...roomForm.equipmentIds, eq.id]
                              : roomForm.equipmentIds.filter((id) => id !== eq.id);
                            setRoomForm({ ...roomForm, equipmentIds: newIds });
                          }}
                          className="rounded bg-slate-900 border-slate-800 text-brand-500 focus:ring-brand-500 h-4 w-4"
                        />
                        {eq.equipmentName}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Trạng thái *</label>
                <select
                  value={roomForm.status}
                  onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 text-sm"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold py-3 px-4 rounded-xl text-sm transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-4 rounded-xl text-sm shadow-lg shadow-brand-600/10 transition-all"
                >
                  Lưu phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Equipment Modal */}
      {eqModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                {selectedEq ? 'Cập nhật thiết bị' : 'Thêm thiết bị'}
              </h3>
              <button 
                onClick={() => setEqModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEqSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Mã thiết bị *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: PROJECTOR_01"
                  value={eqForm.equipmentCode}
                  onChange={(e) => setEqForm({ ...eqForm, equipmentCode: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none focus:border-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Tên thiết bị *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Máy chiếu Panasonic 4K"
                  value={eqForm.equipmentName}
                  onChange={(e) => setEqForm({ ...eqForm, equipmentName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none focus:border-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Mô tả</label>
                <textarea
                  placeholder="Ví dụ: Đặt tại tủ thiết bị B..."
                  value={eqForm.description}
                  onChange={(e) => setEqForm({ ...eqForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-700 focus:outline-none focus:border-brand-500 h-20 resize-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Trạng thái *</label>
                <select
                  value={eqForm.status}
                  onChange={(e) => setEqForm({ ...eqForm, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 text-sm"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEqModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold py-3 px-4 rounded-xl text-sm transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-4 rounded-xl text-sm shadow-lg shadow-brand-600/10 transition-all"
                >
                  Lưu thiết bị
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoomsEquipmentPage;
