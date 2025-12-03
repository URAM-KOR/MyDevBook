// API 호출 래퍼 함수
async function fetchWrapper(url, options = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // 토큰이 있으면 헤더에 추가
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      defaultOptions.headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(fullUrl, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export { fetchWrapper };

