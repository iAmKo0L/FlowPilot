import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import workflowApi from '../api/workflowApi';
import type { WorkflowDefinition } from '../types';
import { AlertCircle, Edit2, Eye, GitBranch, Plus, Play, Trash2 } from 'lucide-react';

type WorkflowForm = {
  code: string;
  name: string;
  description: string;
  bpmnProcessKey: string;
};

const emptyForm: WorkflowForm = {
  code: '',
  name: '',
  description: '',
  bpmnProcessKey: '',
};

export const AdminWorkflowListPage: React.FC = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WorkflowDefinition | null>(null);
  const [form, setForm] = useState<WorkflowForm>(emptyForm);

  const fetchWorkflows = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await workflowApi.getAll();
      if (res.success && res.data) setWorkflows(res.data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách workflow');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (workflow: WorkflowDefinition) => {
    setEditing(workflow);
    setForm({
      code: workflow.code,
      name: workflow.name,
      description: workflow.description || '',
      bpmnProcessKey: workflow.bpmnProcessKey || workflow.code,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim(),
      bpmnProcessKey: form.bpmnProcessKey.trim() || form.code.trim().toLowerCase(),
    };

    try {
      if (editing?.id) {
        await workflowApi.update(editing.id, payload);
      } else {
        await workflowApi.create(payload);
      }
      setModalOpen(false);
      fetchWorkflows();
    } catch (err: any) {
      alert(err.message || 'Không thể lưu workflow');
    }
  };

  const handleDelete = async (workflow: WorkflowDefinition) => {
    if (!workflow.id) return;
    if (!window.confirm(`Xóa workflow ${workflow.name}?`)) return;
    try {
      await workflowApi.delete(workflow.id);
      fetchWorkflows();
    } catch (err: any) {
      alert(err.message || 'Không thể xóa workflow');
    }
  };

  const handleDeployWorkflow = async (id: number) => {
    try {
      await workflowApi.deploy(id);
      alert('Đã deploy workflow lên Camunda engine.');
      fetchWorkflows();
    } catch (err: any) {
      alert(err.message || 'Deploy workflow thất bại');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <GitBranch className="text-brand-500" size={32} />
            Quản lý workflow
          </h2>
          <p className="text-slate-400 text-sm mt-1">Tạo, cấu hình, deploy và quản lý các luồng xử lý đặt lịch họp.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-5 rounded-xl shadow-lg shadow-brand-600/25 transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus size={18} />
          Workflow mới
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-500/15 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle />
          <span>{error}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {workflows.map((wf) => (
            <div key={wf.id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    wf.status === 'DEPLOYED'
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {wf.status}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">v{wf.version}</span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white truncate">{wf.name}</h3>
                  <p className="text-xs text-brand-400 font-mono mt-0.5">{wf.code}</p>
                  <p className="text-slate-400 text-sm mt-2 line-clamp-2 h-10">{wf.description || 'Chưa có mô tả.'}</p>
                </div>

                <div className="border-t border-slate-800 pt-3 flex justify-between text-xs text-slate-500 font-mono">
                  <span>{wf.steps?.length || 0} bước</span>
                  <span className="truncate max-w-[180px]">{wf.bpmnProcessKey || wf.code}</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mt-6 pt-4 border-t border-slate-800/60">
                <button onClick={() => navigate(`/admin/workflows/${wf.id}`)} className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center" title="Cấu hình bước">
                  <Eye size={14} />
                </button>
                <button onClick={() => openEdit(wf)} className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center" title="Sửa workflow">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => wf.id && handleDeployWorkflow(wf.id)} className="bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center" title="Deploy">
                  <Play size={14} />
                </button>
                <button onClick={() => handleDelete(wf)} className="bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 py-2.5 rounded-xl text-xs flex items-center justify-center" title="Xóa">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5">
            <div>
              <h3 className="text-xl font-bold text-white">{editing ? 'Sửa workflow' : 'Tạo workflow'}</h3>
              <p className="text-xs text-slate-500 mt-1">BPMN process key nên giữ ổn định sau khi đã deploy và sử dụng thực tế.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="WORKFLOW_CODE" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm" />
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tên workflow" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm" />
              <input value={form.bpmnProcessKey} onChange={(e) => setForm({ ...form, bpmnProcessKey: e.target.value })} placeholder="bpmn_process_key" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Mô tả" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm h-24 resize-none" />
              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl text-sm">Hủy</button>
                <button type="submit" className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-xl text-sm">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkflowListPage;
