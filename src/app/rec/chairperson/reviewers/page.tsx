"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReviewersPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to settings with reviewers tab
    router.replace('/rec/chairperson/settings?tab=reviewers');
  }, [router]);

  return null;
}
