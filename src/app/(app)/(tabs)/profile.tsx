import React from 'react';
import { ProtectedTab } from '@/features/auth/components/protected-tab';
import { ProfileScreen } from '@/features/profile/screens/profile-screen';

export default function ProfileRoute() {
  return <ProtectedTab tab="profile"><ProfileScreen /></ProtectedTab>;
}
