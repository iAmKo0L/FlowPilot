import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminWorkflowListPage from './pages/AdminWorkflowListPage';
import WorkflowBuilderPage from './pages/WorkflowBuilderPage';
import RequestListPage from './pages/RequestListPage';
import RequestCreatePage from './pages/RequestCreatePage';
import MyTasksPage from './pages/MyTasksPage';
import TaskDetailPage from './pages/TaskDetailPage';
import MonitorDashboardPage from './pages/MonitorDashboardPage';
import ProcessDetailPage from './pages/ProcessDetailPage';
import AdminRoomsEquipmentPage from './pages/AdminRoomsEquipmentPage';
import NotificationsPage from './pages/NotificationsPage';
import PublicAttendeeResponsePage from './pages/PublicAttendeeResponsePage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/public/attendee-response/:token" element={<PublicAttendeeResponsePage />} />

        {/* Protected Authenticated Routes */}
        <Route path="/" element={<Layout />}>
          {/* Default entry point redirect */}
          <Route index element={<Navigate to="/login" replace />} />

          {/* ADMIN Routes */}
          <Route 
            path="admin/workflows" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminWorkflowListPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="admin/workflows/:id" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <WorkflowBuilderPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="admin/rooms-equipment" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminRoomsEquipmentPage />
              </ProtectedRoute>
            } 
          />

          {/* REQUESTER & APPROVER Common Routes */}
          <Route 
            path="notifications" 
            element={
              <ProtectedRoute allowedRoles={['REQUESTER', 'APPROVER', 'ADMIN']}>
                <NotificationsPage />
              </ProtectedRoute>
            } 
          />

          {/* REQUESTER Routes */}
          <Route 
            path="requests" 
            element={
              <ProtectedRoute allowedRoles={['REQUESTER', 'ADMIN']}>
                <RequestListPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="requests/create" 
            element={
              <ProtectedRoute allowedRoles={['REQUESTER', 'ADMIN']}>
                <RequestCreatePage />
              </ProtectedRoute>
            } 
          />

          {/* APPROVER Routes */}
          <Route 
            path="tasks" 
            element={
              <ProtectedRoute allowedRoles={['APPROVER', 'ADMIN']}>
                <MyTasksPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="tasks/:taskId" 
            element={
              <ProtectedRoute allowedRoles={['APPROVER', 'ADMIN']}>
                <TaskDetailPage />
              </ProtectedRoute>
            } 
          />

          {/* MONITOR Dashboard for Admin */}
          <Route 
            path="dashboard" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <MonitorDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="monitor/processes/:id" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'REQUESTER', 'APPROVER']}>
                <ProcessDetailPage />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
