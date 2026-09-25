import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

import { Landing } from './pages/Landing';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { NotFound } from './pages/NotFound';

import { Dashboard } from './pages/app/Dashboard';
import { Discover } from './pages/app/Discover';
import { WhyYouMatched } from './pages/app/WhyYouMatched';
import { Matches } from './pages/app/Matches';
import { Rooms } from './pages/app/Rooms';
import { RoomDetail } from './pages/app/RoomDetail';
import { Chat } from './pages/app/Chat';
import { Notifications } from './pages/app/Notifications';
import { Verification } from './pages/app/Verification';
import { Profile } from './pages/app/Profile';
import { Quiz } from './pages/app/Quiz';

import { AdminDashboard } from './pages/admin/AdminDashboard';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="discover" element={<Discover />} />
              <Route path="discover/:profileId" element={<WhyYouMatched />} />
              <Route path="matches" element={<Matches />} />
              <Route path="rooms" element={<Rooms />} />
              <Route path="rooms/:roomId" element={<RoomDetail />} />
              <Route path="chat" element={<Chat />} />
              <Route path="chat/:threadId" element={<Chat />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="verification" element={<Verification />} />
              <Route path="profile" element={<Profile />} />
              <Route path="quiz" element={<Quiz />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>);

}