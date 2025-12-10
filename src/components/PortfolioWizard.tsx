import { useState } from 'react';
import { colors, spacing, button, typography } from '@/styles/design-tokens';

interface InitialData {
  title?: string;
  content?: string;
  tracking_url?: string;
  tracking_prompt?: string;
}

interface PortfolioWizardProps {
  onSubmit: (data: PortfolioFormData) => void;
  onCancel: () => void;
  initialData?: InitialData | null;
  isEditing?: boolean;
}

export interface PortfolioFormData {
  title: string;
  content: string;
  tracking_url: string;
  tracking_prompt: string;  // 알림 목표
  current_value?: string;   // GPT가 분석한 현재 값
}

interface UrlCheckResult {
  success: boolean;
  error?: string;
  data?: string;
  dataLength?: number;
}

interface AnalysisResult {
  success: boolean;
  error?: string;
  currentValue?: string;
  analysis?: string;
}

// 단계 정의
const STEPS = {
  TITLE: 0,
  CONTENT: 1,
  URL: 2,
  URL_CHECK: 3,      // URL 접근 확인 + GPT 현재값 분석
  ALERT_GOAL: 4,     // 알림 목표 입력
};

export default function PortfolioWizard({ onSubmit, onCancel, initialData, isEditing }: PortfolioWizardProps) {
  const [currentStep, setCurrentStep] = useState(STEPS.TITLE);
  const [formData, setFormData] = useState<PortfolioFormData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    tracking_url: initialData?.tracking_url || '',
    tracking_prompt: initialData?.tracking_prompt || '',
  });
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  
  // URL 체크 상태
  const [checkingUrl, setCheckingUrl] = useState(false);
  const [urlCheckResult, setUrlCheckResult] = useState<UrlCheckResult | null>(null);
  
  // GPT 분석 상태
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const totalSteps = formData.tracking_url ? 5 : 3;
  const isLastStep = currentStep === (formData.tracking_url ? STEPS.ALERT_GOAL : STEPS.URL);
  const isFirstStep = currentStep === STEPS.TITLE;

  // URL 접근 확인
  const checkUrl = async () => {
    setCheckingUrl(true);
    setUrlCheckResult(null);
    setAnalysisResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tracking/check-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ url: formData.tracking_url }),
      });

      const data = await response.json();
      setUrlCheckResult(data);
      
      // URL 접근 성공하면 자동으로 GPT 분석 시작
      if (data.success) {
        analyzeCurrentValue(data.data);
      }
    } catch (error) {
      setUrlCheckResult({ success: false, error: '접근 확인 중 오류가 발생했습니다.' });
    } finally {
      setCheckingUrl(false);
    }
  };

  // GPT로 현재 값 분석
  const analyzeCurrentValue = async (urlData: string) => {
    setAnalyzing(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tracking/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          url: formData.tracking_url,
          data: urlData,
        }),
      });

      const result = await response.json();
      setAnalysisResult(result);
      
      if (result.success) {
        setFormData(prev => ({ ...prev, current_value: result.currentValue }));
      }
    } catch (error) {
      setAnalysisResult({ success: false, error: '분석 중 오류가 발생했습니다.' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      onSubmit(formData);
      return;
    }
    
    setDirection('next');
    
    if (currentStep === STEPS.URL && formData.tracking_url) {
      // URL 입력 후 → URL 체크 단계로
      setCurrentStep(STEPS.URL_CHECK);
      setTimeout(checkUrl, 300);
    } else if (currentStep === STEPS.URL && !formData.tracking_url) {
      // URL 없이 완료
      onSubmit(formData);
    } else if (currentStep === STEPS.URL_CHECK) {
      // URL 체크 성공 후 → 알림 목표 입력으로
      setCurrentStep(STEPS.ALERT_GOAL);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setDirection('prev');
      if (currentStep === STEPS.ALERT_GOAL) {
        setCurrentStep(STEPS.URL_CHECK);
      } else if (currentStep === STEPS.URL_CHECK) {
        setCurrentStep(STEPS.URL);
        setUrlCheckResult(null);
        setAnalysisResult(null);
      } else {
        setCurrentStep(prev => prev - 1);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canProceed()) handleNext();
    }
  };

  const canProceed = () => {
    if (currentStep === STEPS.TITLE) return formData.title.trim() !== '';
    if (currentStep === STEPS.URL_CHECK) return urlCheckResult?.success && analysisResult?.success;
    return true;
  };

  const getProgressSteps = () => {
    if (!formData.tracking_url) return ['이름', '목표', 'URL'];
    return ['이름', '목표', 'URL', '확인', '알림 목표'];
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case STEPS.TITLE:
        return (
          <div>
            <h3 style={styles.stepTitle}>포트폴리오 이름</h3>
            <input
              autoFocus
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="예: 내 GitHub 프로젝트"
              style={styles.input}
              className="focus:border-blue-500"
            />
          </div>
        );

      case STEPS.CONTENT:
        return (
          <div>
            <h3 style={styles.stepTitle}>목표 또는 목적</h3>
            <textarea
              autoFocus
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="예: 스타 1000개 달성하기"
              style={{ ...styles.input, minHeight: '100px', resize: 'none' }}
              className="focus:border-blue-500"
            />
            <p style={styles.hint}>💡 나중에 설정하려면 비워두고 다음으로</p>
          </div>
        );

      case STEPS.URL:
        return (
          <div>
            <h3 style={styles.stepTitle}>추적할 URL</h3>
            <input
              autoFocus
              type="url"
              value={formData.tracking_url}
              onChange={(e) => setFormData({ ...formData, tracking_url: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="예: https://api.github.com/repos/owner/repo"
              style={styles.input}
              className="focus:border-blue-500"
            />
            {formData.tracking_url && (
              <div style={styles.infoBox}>
                <span style={{ fontSize: '20px' }}>💡</span>
                <p style={{ fontSize: '13px', color: colors.gray[700], margin: 0 }}>
                  <strong>공개적으로 접근 가능한 URL</strong>만 추적할 수 있습니다.
                </p>
              </div>
            )}
            <p style={styles.hint}>💡 추적 기능이 필요 없으면 비워두고 완료</p>
          </div>
        );

      case STEPS.URL_CHECK:
        return (
          <div>
            <h3 style={styles.stepTitle}>🔍 URL 확인 중</h3>
            
            {/* URL 접근 확인 */}
            <div style={styles.checkSection}>
              <div style={styles.checkHeader}>
                <span style={{ fontSize: '18px' }}>
                  {checkingUrl ? '⏳' : urlCheckResult?.success ? '✅' : '❌'}
                </span>
                <strong>URL 접근</strong>
              </div>
              {checkingUrl ? (
                <p style={styles.checkStatus}>접근 확인 중...</p>
              ) : urlCheckResult?.success ? (
                <p style={styles.checkStatus}>
                  접근 성공! ({urlCheckResult.dataLength?.toLocaleString()} bytes)
                </p>
              ) : (
                <p style={{ ...styles.checkStatus, color: '#dc2626' }}>
                  {urlCheckResult?.error || '접근할 수 없습니다'}
                </p>
              )}
            </div>

            {/* GPT 분석 */}
            {urlCheckResult?.success && (
              <div style={styles.checkSection}>
                <div style={styles.checkHeader}>
                  <span style={{ fontSize: '18px' }}>
                    {analyzing ? '⏳' : analysisResult?.success ? '✅' : '❌'}
                  </span>
                  <strong>현재 상태 분석 (GPT)</strong>
                </div>
                {analyzing ? (
                  <p style={styles.checkStatus}>GPT가 분석 중...</p>
                ) : analysisResult?.success ? (
                  <div style={styles.analysisBox}>
                    <p style={{ margin: 0, fontSize: '14px', color: colors.gray[800] }}>
                      <strong>📊 현재 값:</strong>
                    </p>
                    <p style={{ margin: '8px 0 0', fontSize: '16px', color: colors.blue[600] }}>
                      {analysisResult.currentValue}
                    </p>
                    {analysisResult.analysis && (
                      <p style={{ margin: '8px 0 0', fontSize: '13px', color: colors.gray[600] }}>
                        {analysisResult.analysis}
                      </p>
                    )}
                  </div>
                ) : (
                  <p style={{ ...styles.checkStatus, color: '#dc2626' }}>
                    {analysisResult?.error || '분석할 수 없습니다'}
                  </p>
                )}
              </div>
            )}

            {/* 재시도 버튼 */}
            {!checkingUrl && !analyzing && (
              <button onClick={checkUrl} style={styles.retryButton}>
                🔄 다시 확인
              </button>
            )}
          </div>
        );

      case STEPS.ALERT_GOAL:
        return (
          <div>
            <h3 style={styles.stepTitle}>🔔 알림 목표</h3>
            <p style={{ fontSize: '14px', color: colors.gray[600], marginBottom: spacing.md }}>
              어떤 조건일 때 알림을 받고 싶으세요?
            </p>
            <textarea
              autoFocus
              value={formData.tracking_prompt}
              onChange={(e) => setFormData({ ...formData, tracking_prompt: e.target.value })}
              placeholder="예: 스타 수가 100개를 넘으면 알림"
              style={{ ...styles.input, minHeight: '100px', resize: 'none' }}
              className="focus:border-blue-500"
            />
            {formData.current_value && (
              <div style={styles.currentValueBox}>
                <span style={{ fontSize: '14px' }}>📊</span>
                <span style={{ fontSize: '13px', color: colors.gray[600] }}>
                  현재 값: <strong style={{ color: colors.blue[600] }}>{formData.current_value}</strong>
                </span>
              </div>
            )}
            <p style={styles.hint}>
              💡 배치로 주기적으로 확인하여 목표 도달 시 알림을 보내드립니다
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: spacing.xl, paddingTop: '48px' }}>
      {/* Progress indicator */}
      <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.xl }}>
        {getProgressSteps().map((label, index) => (
          <div key={index} style={{ flex: 1, textAlign: 'center' }}>
            <div
              style={{
                height: '4px',
                borderRadius: '2px',
                backgroundColor: index <= currentStep ? colors.blue[500] : colors.gray[200],
                transition: 'background-color 300ms',
                marginBottom: '4px',
              }}
            />
            <span style={{ fontSize: '10px', color: index <= currentStep ? colors.blue[500] : colors.gray[400] }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div
        key={currentStep}
        style={{
          minHeight: '280px',
          animation: `slideIn${direction === 'next' ? 'Right' : 'Left'} 300ms ease-out`,
        }}
      >
        {renderStepContent()}
      </div>

      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: spacing.xl }}>
        <button
          onClick={isFirstStep ? onCancel : handlePrev}
          style={styles.secondaryButton}
          className="hover:bg-gray-200"
        >
          {isFirstStep ? '취소' : '이전'}
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed() || checkingUrl || analyzing}
          style={{
            ...styles.primaryButton,
            backgroundColor: canProceed() && !checkingUrl && !analyzing ? colors.blue[500] : colors.gray[300],
            cursor: canProceed() && !checkingUrl && !analyzing ? 'pointer' : 'not-allowed',
          }}
          className={canProceed() && !checkingUrl && !analyzing ? 'hover:bg-blue-600' : ''}
        >
          {checkingUrl || analyzing ? '확인 중...' : isLastStep ? '✓ 완료' : '다음'}
        </button>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// 스타일 정의
const styles = {
  stepTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: colors.gray[800],
    marginBottom: spacing.lg,
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: spacing.md,
    fontSize: typography.title.size,
    border: `2px solid ${colors.gray[200]}`,
    borderRadius: button.borderRadius,
    outline: 'none',
  } as React.CSSProperties,
  hint: {
    fontSize: '12px',
    color: colors.gray[400],
    marginTop: spacing.sm,
  } as React.CSSProperties,
  infoBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: '#e8f5e9',
    borderRadius: '12px',
    border: '1px solid #a5d6a7',
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  } as React.CSSProperties,
  checkSection: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: '12px',
  } as React.CSSProperties,
  checkHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  } as React.CSSProperties,
  checkStatus: {
    fontSize: '13px',
    color: colors.gray[600],
    margin: 0,
  } as React.CSSProperties,
  analysisBox: {
    padding: spacing.md,
    backgroundColor: '#e3f2fd',
    borderRadius: '8px',
    marginTop: spacing.sm,
  } as React.CSSProperties,
  currentValueBox: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.gray[100],
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  } as React.CSSProperties,
  retryButton: {
    padding: `${spacing.xs} ${spacing.md}`,
    backgroundColor: colors.gray[200],
    color: colors.gray[700],
    borderRadius: button.borderRadius,
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  } as React.CSSProperties,
  primaryButton: {
    padding: `${spacing.sm} ${spacing.lg}`,
    color: 'white',
    borderRadius: button.borderRadius,
    border: 'none',
    fontSize: '16px',
  } as React.CSSProperties,
  secondaryButton: {
    padding: `${spacing.sm} ${spacing.lg}`,
    backgroundColor: colors.gray[100],
    color: colors.gray[600],
    borderRadius: button.borderRadius,
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
  } as React.CSSProperties,
};
