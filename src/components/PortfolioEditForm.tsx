'use client';

import { useState } from 'react';
import { colors, spacing, button, typography } from '@/styles/design-tokens';
import { Portfolio } from '@/types';
import { PortfolioFormData } from './PortfolioWizard';

interface PortfolioEditFormProps {
  portfolio: Portfolio;
  onSubmit: (data: PortfolioFormData) => void;
  onCancel: () => void;
}

export default function PortfolioEditForm({ portfolio, onSubmit, onCancel }: PortfolioEditFormProps) {
  // 알림 켜기/끄기 상태 (notification_enabled 또는 tracking_prompt 존재 여부로 판단)
  const isNotificationEnabled = (portfolio as any).notification_enabled !== false && !!portfolio.tracking_prompt;

  const [formData, setFormData] = useState<PortfolioFormData & { image_url?: string }>({
    title: portfolio.title || '',
    description: portfolio.description || '',
    content: portfolio.content || portfolio.target_key || '',
    tracking_url: portfolio.tracking_url || '',
    tracking_prompt: portfolio.tracking_prompt || '',
    current_value: portfolio.current_value || undefined,
    image_url: portfolio.image_url || '',
  });
  const [isNotificationOn, setIsNotificationOn] = useState(isNotificationEnabled);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // tracking_prompt는 항상 그대로 전송, notification_enabled는 토글 상태로 전송
      onSubmit({
        ...formData,
        notification_enabled: isNotificationOn,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: spacing.md, maxHeight: '90vh', overflowY: 'auto' }}>
      <h2 style={{
        fontSize: '18px',
        fontWeight: 600,
        color: colors.gray[800],
        marginBottom: spacing.md
      }}>
        포트폴리오 수정
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {/* 제목 (수정 가능) - 위쪽으로 */}
        <div>
          <label style={styles.label}>
            제목 *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            style={styles.input}
            placeholder="예: 내 GitHub 프로젝트"
          />
        </div>

        {/* 설명 (수정 가능) */}
        <div>
          <label style={styles.label}>
            설명 (메모)
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
            placeholder="이 포트폴리오에 대한 메모를 남겨보세요..."
          />
        </div>

        {/* 이미지 URL (수정 가능) */}
        <div>
          <label style={styles.label}>
            이미지 URL
          </label>
          <input
            type="url"
            value={formData.image_url || ''}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            style={styles.input}
            placeholder="https://example.com/image.jpg"
          />
          {formData.image_url && (
            <div style={{ marginTop: spacing.xs }}>
              <img
                src={formData.image_url}
                alt="미리보기"
                style={{
                  width: '100%',
                  maxHeight: '120px',
                  objectFit: 'cover',
                  borderRadius: '6px',
                  border: `1px solid ${colors.gray[200]}`,
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* 알림 켜기/끄기 토글 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
            <label style={styles.label}>
              알림
            </label>
            <div
              onClick={() => {
                setIsNotificationOn(!isNotificationOn);
                // 알림을 켤 때 값이 없으면 기본값 설정
                if (!isNotificationOn && !formData.tracking_prompt) {
                  setFormData({ ...formData, tracking_prompt: '이틀이상 지나면 알림' });
                }
              }}
              style={{
                position: 'relative',
                width: '60px',
                height: '30px',
                borderRadius: '15px',
                backgroundColor: isNotificationOn ? '#10b981' : '#d1d5db',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
                boxShadow: isNotificationOn
                  ? '0 0 8px rgba(16, 185, 129, 0.4)'
                  : 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  transition: 'transform 0.3s ease',
                  transform: isNotificationOn ? 'translateX(30px)' : 'translateX(0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                }}
              >
                {isNotificationOn ? '✨' : '😴'}
              </div>
              <span
                style={{
                  position: 'absolute',
                  right: isNotificationOn ? '8px' : 'auto',
                  left: isNotificationOn ? 'auto' : '8px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'white',
                  transition: 'opacity 0.2s ease',
                  opacity: 0.9,
                  pointerEvents: 'none',
                }}
              >
                {isNotificationOn ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
          <textarea
            value={formData.tracking_prompt || ''}
            onChange={(e) => setFormData({ ...formData, tracking_prompt: e.target.value })}
            disabled={!isNotificationOn}
            style={{
              ...styles.input,
              minHeight: '60px',
              resize: 'vertical',
              backgroundColor: isNotificationOn ? 'white' : colors.gray[100],
              color: isNotificationOn ? colors.gray[900] : colors.gray[400],
              cursor: isNotificationOn ? 'text' : 'not-allowed',
              opacity: isNotificationOn ? 1 : 0.6,
            }}
            placeholder={isNotificationOn ? "예: 이틀이상 지나면 알림, 100개 이상이면 알림" : "알림을 켜면 조건을 입력할 수 있습니다"}
          />
        </div>

        {/* 정보 카드 그리드 - 아래쪽으로 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: spacing.sm,
          marginTop: spacing.xs,
        }}>
          {/* 추적 URL (읽기 전용) */}
          {portfolio.tracking_url && (
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>🔗 추적 URL</div>
              <div style={styles.infoValue} title={portfolio.tracking_url}>
                {portfolio.tracking_url.length > 30
                  ? `${portfolio.tracking_url.substring(0, 30)}...`
                  : portfolio.tracking_url}
              </div>
            </div>
          )}

          {/* 목표 키 (읽기 전용) */}
          {(portfolio.content || portfolio.target_key) && (
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>🎯 추적 목표</div>
              <div style={styles.infoValue}>
                {portfolio.content || portfolio.target_key}
              </div>
            </div>
          )}

          {/* 현재 값 (읽기 전용) */}
          {portfolio.current_value && (
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>📊 현재 값</div>
              <div style={{ ...styles.infoValue, color: colors.blue[600], fontWeight: 600 }}>
                {portfolio.current_value}
              </div>
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end', marginTop: spacing.sm }}>
          <button
            type="button"
            onClick={onCancel}
            style={styles.secondaryButton}
            className="hover:bg-gray-200"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.title.trim()}
            style={{
              ...styles.primaryButton,
              backgroundColor: formData.title.trim() && !isSubmitting ? colors.blue[500] : colors.gray[300],
              cursor: formData.title.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
            }}
            className={formData.title.trim() && !isSubmitting ? 'hover:bg-blue-600' : ''}
          >
            {isSubmitting ? '저장 중...' : '✓ 저장'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: '14px',
    border: `1px solid ${colors.gray[200]}`,
    borderRadius: button.borderRadius,
    outline: 'none',
    transition: 'border-color 200ms',
  } as React.CSSProperties,
  hint: {
    fontSize: '11px',
    color: colors.gray[400],
    marginTop: spacing.xs,
    marginBottom: 0,
  } as React.CSSProperties,
  infoCard: {
    padding: spacing.sm,
    backgroundColor: colors.gray[50],
    borderRadius: '6px',
    border: `1px solid ${colors.gray[200]}`,
  } as React.CSSProperties,
  infoLabel: {
    fontSize: '10px',
    color: colors.gray[500],
    marginBottom: spacing.xs,
    fontWeight: 500,
  } as React.CSSProperties,
  infoValue: {
    fontSize: '12px',
    color: colors.gray[700],
    wordBreak: 'break-word',
  } as React.CSSProperties,
  primaryButton: {
    padding: `${spacing.xs} ${spacing.md}`,
    color: 'white',
    borderRadius: button.borderRadius,
    border: 'none',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'background-color 200ms',
  } as React.CSSProperties,
  secondaryButton: {
    padding: `${spacing.xs} ${spacing.md}`,
    backgroundColor: colors.gray[100],
    color: colors.gray[600],
    borderRadius: button.borderRadius,
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'background-color 200ms',
  } as React.CSSProperties,
};

