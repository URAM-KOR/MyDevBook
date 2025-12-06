'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { User } from '@/types';

export default function Home() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 토큰 검증 및 사용자 정보 복원
    const verifyAndRestoreUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // 토큰이 없으면 저장된 사용자 정보도 삭제
        localStorage.removeItem('user');
        return;
      }

      try {
        // 토큰 검증 API 호출
        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.valid && data.user) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          } else {
            // 토큰이 유효하지 않으면 정리
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } else {
          // 토큰이 만료되었거나 유효하지 않음
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Failed to verify token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    };

    verifyAndRestoreUser();

    if (!searchParams) return;
    
    // URL에서 토큰과 사용자 정보 확인
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    if (token && userParam) {
      // 토큰을 localStorage에 저장
      localStorage.setItem('token', token);
      
      // 사용자 정보 저장
      try {
        const userData = JSON.parse(userParam);
        setUser(userData);
        localStorage.setItem('user', userParam); // 사용자 정보도 저장
        
        // URL에서 토큰과 사용자 정보 제거
        window.history.replaceState({}, '', '/');
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    }

    // 에러 확인
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(errorParam);
      window.history.replaceState({}, '', '/');
    }
  }, [searchParams]);

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gray-800">MyDevBook</h1>
          <p className="text-xl text-gray-600">포트폴리오 관리 및 상태 추적 서비스</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-bold">로그인 오류</p>
            <p className="text-sm">
              {error === 'no_code' && '인증 코드를 받지 못했습니다.'}
              {error === 'config' && 'OAuth 설정이 올바르지 않습니다.'}
              {error === 'auth_failed' && '인증에 실패했습니다.'}
            </p>
          </div>
        )}

        {user ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">환영합니다!</h2>
                <p className="text-gray-600 mt-2">{user.name}님 ({user.email})</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
              >
                로그아웃
              </button>
            </div>
            <div className="border-t pt-6">
              <p className="text-gray-600 mb-4">포트폴리오를 관리하고 상태를 추적해보세요.</p>
              <a
                href="/portfolios"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                📁 포트폴리오 관리하기
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">시작하기</h2>
            <p className="text-gray-600 mb-8">
              Google 계정으로 로그인하여 포트폴리오를 관리하세요.
            </p>
            <button
              onClick={handleGoogleLogin}
              className="px-6 py-3 bg-white border-2 border-gray-300 rounded-lg shadow hover:bg-gray-50 transition flex items-center gap-3 mx-auto"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-medium text-gray-700">Google로 로그인</span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
