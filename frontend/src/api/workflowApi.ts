import axiosClient from './axiosClient';
import type { WorkflowDefinition } from '../types';

export const workflowApi = {
  getAll: (): Promise<{ success: boolean; data: WorkflowDefinition[] }> => 
    axiosClient.get('/api/admin/workflows'),
  getById: (id: number): Promise<{ success: boolean; data: WorkflowDefinition }> => 
    axiosClient.get(`/api/admin/workflows/${id}`),
  create: (data: any): Promise<{ success: boolean; data: WorkflowDefinition }> => 
    axiosClient.post('/api/admin/workflows', data),
  update: (id: number, data: any): Promise<{ success: boolean; data: WorkflowDefinition }> => 
    axiosClient.put(`/api/admin/workflows/${id}`, data),
  delete: (id: number): Promise<{ success: boolean }> => 
    axiosClient.delete(`/api/admin/workflows/${id}`),
  addStep: (id: number, data: any): Promise<{ success: boolean; data: WorkflowDefinition }> => 
    axiosClient.post(`/api/admin/workflows/${id}/steps`, data),
  updateStep: (id: number, stepId: number, data: any): Promise<{ success: boolean; data: WorkflowDefinition }> => 
    axiosClient.put(`/api/admin/workflows/${id}/steps/${stepId}`, data),
  deleteStep: (id: number, stepId: number): Promise<{ success: boolean; data: WorkflowDefinition }> => 
    axiosClient.delete(`/api/admin/workflows/${id}/steps/${stepId}`),
  previewXml: (id: number): Promise<{ success: boolean; data: string }> => 
    axiosClient.get(`/api/admin/workflows/${id}/bpmn-preview`),
  deploy: (id: number): Promise<{ success: boolean; data: WorkflowDefinition }> => 
    axiosClient.post(`/api/admin/workflows/${id}/deploy`),
  getAvailable: (): Promise<{ success: boolean; data: WorkflowDefinition[] }> => 
    axiosClient.get('/api/workflows/available'),
};
export default workflowApi;
