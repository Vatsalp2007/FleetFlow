import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import Login from './pages/Login';
import AddVehicle from './pages/AddVehicle';
import EditVehicle from './pages/EditVehicle';
import TripDispatcher from './pages/TripDispatcher';
import MaintenanceLogs from './pages/MaintenanceLogs';
import ExpenseAndFuelLogs from './pages/ExpenseAndFuelLogs';
import DriverProfiles from './pages/DriverProfiles';
import ReportsDashboard from './pages/ReportsDashboard';
import Settings from './pages/Settings';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import ManageUsers from './pages/ManageUsers';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <RoleProtectedRoute allowedRoles={["manager", "dispatcher"]}>
              <Dashboard />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/add-vehicle" 
          element={
            <RoleProtectedRoute allowedRoles={["manager"]}>
              <AddVehicle />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/edit-vehicle/:id" 
          element={
            <RoleProtectedRoute allowedRoles={["manager"]}>
              <EditVehicle />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/trip-dispatcher" 
          element={
            <RoleProtectedRoute allowedRoles={["manager", "dispatcher"]}>
              <TripDispatcher />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/maintenance" 
          element={
            <RoleProtectedRoute allowedRoles={["manager", "dispatcher"]}>
              <MaintenanceLogs />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/expenses" 
          element={
            <RoleProtectedRoute allowedRoles={["manager", "dispatcher"]}>
              <ExpenseAndFuelLogs />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/drivers" 
          element={
            <RoleProtectedRoute allowedRoles={["manager", "dispatcher"]}>
              <DriverProfiles />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <RoleProtectedRoute allowedRoles={["manager"]}>
              <ReportsDashboard />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <RoleProtectedRoute allowedRoles={["manager"]}>
              <Settings />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/manage-users" 
          element={
            <RoleProtectedRoute allowedRoles={["manager"]}>
              <ManageUsers />
            </RoleProtectedRoute>
          } 
        />
        {/* Catch-all redirect to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
