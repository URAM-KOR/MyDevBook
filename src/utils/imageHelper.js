// 이미지 URL 헬퍼 함수
function getImageUrl(imageUrl, title = '') {
  // 이미지 URL이 있으면 그대로 반환
  if (imageUrl && imageUrl.trim() !== '') {
    return imageUrl;
  }
  
  // 이미지가 없으면 제목 기반 텍스트 이미지 생성
  if (title && title.trim() !== '') {
    // 제목의 첫 글자 추출 (한글, 영문 모두 지원)
    const firstChar = title.trim().charAt(0).toUpperCase();
    
    // UI Avatars를 사용한 텍스트 기반 아바타 생성
    // 배경색은 제목의 해시값으로 결정하여 일관성 유지
    const colors = [
      '4F46E5', // Indigo
      '059669', // Emerald
      'DC2626', // Red
      'EA580C', // Orange
      '7C3AED', // Violet
      '0891B2', // Cyan
      'BE185D', // Pink
      'B45309', // Amber
    ];
    
    // 제목의 해시값으로 색상 선택 (일관성 유지)
    const hash = title.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const colorIndex = Math.abs(hash) % colors.length;
    const bgColor = colors[colorIndex];
    
    // UI Avatars API 사용
    const encodedTitle = encodeURIComponent(title);
    return `https://ui-avatars.com/api/?name=${encodedTitle}&size=400&background=${bgColor}&color=FFFFFF&bold=true&font-size=0.5`;
  }
  
  // 제목도 없으면 기본 placeholder
  return 'https://ui-avatars.com/api/?name=Portfolio&size=400&background=6B7280&color=FFFFFF&bold=true';
}

function validateImageUrl(url) {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

module.exports = { getImageUrl, validateImageUrl };

