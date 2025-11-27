"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RECMembersPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to settings with members tab
    router.replace('/rec/chairperson/settings?tab=members');
  }, [router]);

  return null;
}

