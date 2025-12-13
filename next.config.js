/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 개발 환경에서 허용할 도메인 설정 (Cross origin 경고 해결)
  allowedDevOrigins: [
    'fairyquest.click',
    'https://fairyquest.click',
    'http://fairyquest.click',
  ],
  experimental: {
    // 필요시 추가 설정
  },
}

module.exports = nextConfig

