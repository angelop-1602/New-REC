import { ReviewerAuthProvider } from '@/contexts/ReviewerAuthContext';

export default function ReviewersLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReviewerAuthProvider>
      <div className="min-h-screen">
        {children}
      </div>
    </ReviewerAuthProvider>
  );
}
