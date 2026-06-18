import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import workflowApi from '../api/workflowApi';
import type { WorkflowDefinition, WorkflowStep } from '../types';
import { AlertCircle, ChevronLeft, Code, Edit2, LayoutGrid, Plus, Play, Trash2 } from 'lucide-react';

type StepForm = {
  stepKey: string;
  stepName: string;
  stepType: WorkflowStep['stepType'];
  assigneeRole: string;
  orderIndex: number;
  configJson: string;
};

const emptyStep: StepForm = {
  stepKey: '',
  stepName: '',
  stepType: 'SERVICE_TASK',
  assigneeRole: '',
  orderIndex: 1,
  configJson: '',
};

const stepTypes: WorkflowStep['stepType'][] = ['START', 'SERVICE_TASK', 'USER_TASK', 'APPROVE', 'CONDITION', 'END'];
const roles = ['', 'REQUESTER', 'APPROVER', 'ADMIN'];

export const WorkflowBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const workflowId = Number(id);

  const [workflow, setWorkflow] = useState<WorkflowDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'steps' | 'xml'>('steps');
  const [xmlPreview, setXmlPreview] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);
  const [stepForm, setStepForm] = useState<StepForm>(emptyStep);

  const fetchWorkflowDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await workflowApi.getById(workflowId);
      if (res.success && res.data) setWorkflow(res.data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải chi tiết workflow');
    } finally {
      setLoading(false);
    }
  };

  const fetchXmlPreview = async () => {
    try {
      const res = await workflowApi.previewXml(workflowId);
      if (res.success && res.data) setXmlPreview(res.data);
    } catch (err: any) {
      setXmlPreview(err.message || 'Không thể sinh BPMN XML');
    }
  };

  useEffect(() => {
    fetchWorkflowDetails();
  }, [workflowId]);

  useEffect(() => {
    if (activeTab === 'xml') fetchXmlPreview();
  }, [activeTab, workflow?.updatedAt, workflow?.steps?.length]);

  const openCreateStep = () => {
    const nextOrder = (workflow?.steps || []).reduce((max, step) => Math.max(max, step.orderIndex), 0) + 1;
    setEditingStep(null);
    setStepForm({ ...emptyStep, orderIndex: nextOrder });
    setModalOpen(true);
  };

  const openEditStep = (step: WorkflowStep) => {
    setEditingStep(step);
    setStepForm({
      stepKey: step.stepKey,
      stepName: step.stepName,
      stepType: step.stepType,
      assigneeRole: step.assigneeRole || '',
      orderIndex: step.orderIndex,
      configJson: step.configJson || '',
    });
    setModalOpen(true);
  };

  const saveStep = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      ...stepForm,
      stepKey: stepForm.stepKey.trim(),
      stepName: stepForm.stepName.trim(),
      assigneeRole: stepForm.assigneeRole || undefined,
      configJson: stepForm.configJson.trim() || undefined,
    };

    try {
      if (editingStep?.id) {
        const res = await workflowApi.updateStep(workflowId, editingStep.id, payload);
        if (res.success) setWorkflow(res.data);
      } else {
        const res = await workflowApi.addStep(workflowId, payload);
        if (res.success) setWorkflow(res.data);
      }
      setModalOpen(false);
      setXmlPreview('');
    } catch (err: any) {
      alert(err.message || 'Không thể lưu bước');
    }
  };

  const deleteStep = async (step: WorkflowStep) => {
    if (!step.id) return;
    if (!window.confirm(`Xóa bước ${step.stepName}?`)) return;
    try {
      const res = await workflowApi.deleteStep(workflowId, step.id);
      if (res.success) setWorkflow(res.data);
      setXmlPreview('');
    } catch (err: any) {
      alert(err.message || 'Không thể xóa bước');
    }
  };

  const handleDeploy = async () => {
    try {
      const res = await workflowApi.deploy(workflowId);
      if (res.success && res.data) {
        setWorkflow(res.data);
        alert('Đã deploy workflow lên Camunda engine.');
      }
    } catch (err: any) {
      alert(err.message || 'Deploy workflow thất bại');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="bg-red-500/15 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
        <AlertCircle />
        <span>{error || 'Không tìm thấy workflow'}</span>
      </div>
    );
  }

  const sortedSteps = [...(workflow.steps || [])].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button onClick={() => navigate('/admin/workflows')} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-white mb-2 transition-colors">
            <ChevronLeft size={16} />
            Quay lại danh sách
          </button>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">{workflow.name}</h2>
          <p className="text-slate-400 text-sm mt-1">{workflow.description || 'Cấu hình workflow động'}</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={openCreateStep} className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-5 rounded-xl transition-all flex items-center gap-2 text-sm">
            <Plus size={18} />
            Thêm bước
          </button>
          <button onClick={handleDeploy} className="bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-5 rounded-xl shadow-lg shadow-brand-600/25 transition-all flex items-center gap-2 active:scale-95 text-sm">
            <Play size={18} />
            Deploy
          </button>
        </div>
      </div>

      <div className="border-b border-slate-800 flex justify-between items-center">
        <div className="flex gap-4">
          <button onClick={() => setActiveTab('steps')} className={`py-3 px-1 border-b-2 text-sm font-semibold flex items-center gap-2 ${activeTab === 'steps' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            <LayoutGrid size={16} />
            Các bước đã cấu hình ({sortedSteps.length})
          </button>
          <button onClick={() => setActiveTab('xml')} className={`py-3 px-1 border-b-2 text-sm font-semibold flex items-center gap-2 ${activeTab === 'xml' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            <Code size={16} />
            BPMN XML được sinh
          </button>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${workflow.status === 'DEPLOYED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
          {workflow.status}
        </span>
      </div>

      {activeTab === 'steps' ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6 w-16 text-center">STT</th>
                <th className="py-4 px-6">Step Key</th>
                <th className="py-4 px-6">Tên bước</th>
                <th className="py-4 px-6">Loại</th>
                <th className="py-4 px-6">Role xử lý</th>
                <th className="py-4 px-6">Config JSON</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-sm">
              {sortedSteps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">Chưa có bước nào. Hãy thêm START, task, condition và END trước khi deploy.</td>
                </tr>
              ) : (
                sortedSteps.map((step) => (
                  <tr key={step.id} className="hover:bg-slate-900/25 transition-colors">
                    <td className="py-4 px-6 font-mono text-center text-slate-500">{step.orderIndex}</td>
                    <td className="py-4 px-6 font-mono text-xs text-brand-400 font-bold">{step.stepKey}</td>
                    <td className="py-4 px-6 text-white font-semibold">{step.stepName}</td>
                    <td className="py-4 px-6"><span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">{step.stepType}</span></td>
                    <td className="py-4 px-6 font-bold text-slate-400">{step.assigneeRole || '-'}</td>
                    <td className="py-4 px-6 max-w-xs truncate font-mono text-xs text-slate-500" title={step.configJson}>{step.configJson || '-'}</td>
                    <td className="py-4 px-6">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditStep(step)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg" title="Sửa bước"><Edit2 size={14} /></button>
                        <button onClick={() => deleteStep(step)} className="bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 p-2 rounded-lg" title="Xóa bước"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-850">
            <span className="text-xs font-semibold text-slate-500 font-mono">{workflow.bpmnProcessKey || workflow.code}.bpmn.xml</span>
            <button onClick={() => navigator.clipboard.writeText(xmlPreview)} className="text-xs text-brand-400 hover:text-brand-300 font-bold">Sao chép XML</button>
          </div>
          <pre className="text-xs text-slate-400 font-mono overflow-auto max-h-[560px] leading-relaxed bg-slate-900/30 p-4 rounded-xl border border-slate-900">
            <code>{xmlPreview || 'Đang tải bản xem trước XML...'}</code>
          </pre>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-5">
            <h3 className="text-xl font-bold text-white">{editingStep ? 'Sửa bước' : 'Thêm bước'}</h3>
            <form onSubmit={saveStep} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required value={stepForm.stepKey} onChange={(e) => setStepForm({ ...stepForm, stepKey: e.target.value })} placeholder="step_key" className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm" />
                <input required value={stepForm.stepName} onChange={(e) => setStepForm({ ...stepForm, stepName: e.target.value })} placeholder="Tên bước" className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm" />
                <select value={stepForm.stepType} onChange={(e) => setStepForm({ ...stepForm, stepType: e.target.value as WorkflowStep['stepType'] })} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm">
                  {stepTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <input type="number" min={1} value={stepForm.orderIndex} onChange={(e) => setStepForm({ ...stepForm, orderIndex: Number(e.target.value) })} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm" />
                <select value={stepForm.assigneeRole} onChange={(e) => setStepForm({ ...stepForm, assigneeRole: e.target.value })} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm md:col-span-2">
                  {roles.map((role) => <option key={role || 'none'} value={role}>{role || 'Không gán role'}</option>)}
                </select>
              </div>
              <textarea value={stepForm.configJson} onChange={(e) => setStepForm({ ...stepForm, configJson: e.target.value })} placeholder='Với CONDITION: {"variable":"approved","trueTarget":"completed","falseTarget":"rejected"}' className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm h-28 resize-none font-mono" />
              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl text-sm">Hủy</button>
                <button type="submit" className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-xl text-sm">Lưu bước</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowBuilderPage;
