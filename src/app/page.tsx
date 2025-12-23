'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Hero from "@/components/landing/Hero";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Check if returning from Google Login (URL Params)
      const tokenParam = searchParams.get('token');
      const userParam = searchParams.get('user');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        // Handle error (optional: show toast)
        console.error("Login failed:", errorParam);
        setIsLoading(false);
        return;
      }

      if (tokenParam && userParam) {
        // Save session
        localStorage.setItem('token', tokenParam);
        localStorage.setItem('user', userParam);

        // Redirect to portfolios
        router.push('/portfolios');
        return;
      }

      // 2. Check if already logged in (Local Storage)
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Optional: Validate token with backend
          const response = await fetch('/api/auth/verify', {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            router.push('/portfolios');
            return;
          } else {
            // Invalid token
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error(error);
        }
      }

      // Not logged in
      setIsLoading(false);
    };

    checkAuth();
  }, [searchParams, router]);

  if (isLoading) {
    // Show a simple loading screen that matches the theme
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sky-300 to-green-300">
        <div className="animate-bounce text-6xl mb-4">🧚</div>
        <div className="text-white text-xl font-bold animate-pulse">Loading Adventure...</div>
      </div>
    );
  }

  return (
    <main>
      <Hero />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-sky-200">
        Loading...
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
