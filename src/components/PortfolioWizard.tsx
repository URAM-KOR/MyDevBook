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
  content: string;          // 목표 키 (추적할 대상)
  tracking_url: string;
  tracking_prompt: string;  // 알림 조건
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
  URL: 1,
  URL_CHECK: 2,        // URL 접근 확인
  TARGET_KEY: 3,       // 목표 키 입력 (추적할 대상)
  TARGET_VALUE: 4,     // 현재 목표값 확인 (GPT 분석)
  ALERT_CONDITION: 5,  // 알림 조건 입력
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

  const isLastStep = currentStep === (formData.tracking_url ? STEPS.ALERT_CONDITION : STEPS.URL);
  const isFirstStep = currentStep === STEPS.TITLE;

  // URL 접근 확인 (데이터 반환)
  const checkUrl = async () => {
    if (!formData.tracking_url) return null;

    setCheckingUrl(true);
    setUrlCheckResult(null);

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
      return data;
    } catch (error) {
      const fail = { success: false, error: '접근 확인 중 오류가 발생했습니다.' };
      setUrlCheckResult(fail);
      return fail;
    } finally {
      setCheckingUrl(false);
    }
  };

  // GPT로 목표값 분석
  const analyzeTargetValue = async () => {
    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      // 항상 최신 데이터를 확보하기 위해 URL 확인부터 다시 실행
      const fresh = await checkUrl();
      if (!fresh?.success || !fresh.data) {
        setAnalysisResult({ success: false, error: fresh?.error || 'URL 데이터를 가져오지 못했습니다.' });
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/tracking/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          url: formData.tracking_url,
          data: fresh.data,
          targetKey: formData.content || '핵심 값',  // 목표 키 (미입력 시 기본값)
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
    
    if (currentStep === STEPS.TITLE) {
      setCurrentStep(STEPS.URL);
    } else if (currentStep === STEPS.URL && formData.tracking_url) {
      setCurrentStep(STEPS.URL_CHECK);
      setTimeout(checkUrl, 300);
    } else if (currentStep === STEPS.URL && !formData.tracking_url) {
      onSubmit(formData);
    } else if (currentStep === STEPS.URL_CHECK) {
      setCurrentStep(STEPS.TARGET_KEY);
    } else if (currentStep === STEPS.TARGET_KEY) {
      setCurrentStep(STEPS.TARGET_VALUE);
      setTimeout(analyzeTargetValue, 300);
    } else if (currentStep === STEPS.TARGET_VALUE) {
      setCurrentStep(STEPS.ALERT_CONDITION);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setDirection('prev');
      if (currentStep === STEPS.ALERT_CONDITION) {
        setCurrentStep(STEPS.TARGET_VALUE);
      } else if (currentStep === STEPS.TARGET_VALUE) {
        setCurrentStep(STEPS.TARGET_KEY);
        setAnalysisResult(null);
      } else if (currentStep === STEPS.TARGET_KEY) {
        setCurrentStep(STEPS.URL_CHECK);
      } else if (currentStep === STEPS.URL_CHECK) {
        setCurrentStep(STEPS.URL);
        setUrlCheckResult(null);
      } else if (currentStep === STEPS.URL) {
        setCurrentStep(STEPS.TITLE);
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
    if (currentStep === STEPS.URL_CHECK) return urlCheckResult?.success;
    if (currentStep === STEPS.TARGET_KEY) return formData.content.trim() !== '';
    if (currentStep === STEPS.TARGET_VALUE) return analysisResult?.success;
    return true;
  };

  const getProgressSteps = () => {
    if (!formData.tracking_url) return ['이름', 'URL'];
    return ['이름', 'URL', 'URL 확인', '목표물', '목표값 확인', '알림조건'];
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
            <h3 style={styles.stepTitle}>🔍 URL 접근 확인</h3>
            
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
                <div>
                  <p style={styles.checkStatus}>
                    ✅ 접근 성공! ({urlCheckResult.dataLength?.toLocaleString()} bytes)
                  </p>
                  <details style={{ marginTop: spacing.sm }}>
                    <summary style={{ cursor: 'pointer', fontSize: '12px', color: colors.gray[500] }}>
                      응답 미리보기
                    </summary>
                    <pre style={styles.previewBox}>
                      {urlCheckResult.data?.substring(0, 300)}...
                    </pre>
                  </details>
                </div>
              ) : (
                <p style={{ ...styles.checkStatus, color: '#dc2626' }}>
                  {urlCheckResult?.error || '접근할 수 없습니다'}
                </p>
              )}
            </div>

            {!checkingUrl && (
              <button onClick={checkUrl} style={styles.retryButton}>
                🔄 다시 확인
              </button>
            )}
          </div>
        );

      case STEPS.TARGET_KEY:
        return (
          <div>
            <h3 style={styles.stepTitle}>🎯 추적할 목표</h3>
            <p style={{ fontSize: '14px', color: colors.gray[600], marginBottom: spacing.md }}>
              어떤 값을 추적하고 싶으세요?
            </p>
            <input
              autoFocus
              type="text"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="예: 스타 수, 가격, 상태, 조회수..."
              style={styles.input}
              className="focus:border-blue-500"
            />
            <p style={styles.hint}>
              💡 GPT가 URL 데이터에서 해당 값을 찾아드립니다
            </p>
          </div>
        );

      case STEPS.TARGET_VALUE:
        return (
          <div>
            <h3 style={styles.stepTitle}>📊 현재 값 확인</h3>
            
            <div style={styles.targetInfo}>
              <span>🎯 추적 목표:</span>
              <strong>{formData.content}</strong>
            </div>

            <div style={styles.checkSection}>
              <div style={styles.checkHeader}>
                <span style={{ fontSize: '18px' }}>
                  {analyzing ? '⏳' : analysisResult?.success ? '✅' : '❌'}
                </span>
                <strong>GPT 분석</strong>
              </div>
              {analyzing ? (
                <p style={styles.checkStatus}>"{formData.content}" 값을 분석 중...</p>
              ) : analysisResult?.success ? (
                <div style={styles.analysisBox}>
                  <p style={{ margin: 0, fontSize: '14px', color: colors.gray[600] }}>
                    현재 값:
                  </p>
                  <p style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: 600, color: colors.blue[600] }}>
                    {analysisResult.currentValue}
                  </p>
                  {analysisResult.analysis && (
                    <p style={{ margin: '8px 0 0', fontSize: '13px', color: colors.gray[500] }}>
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

            {!analyzing && (
              <button onClick={analyzeTargetValue} style={styles.retryButton}>
                🔄 다시 분석
              </button>
            )}
          </div>
        );

      case STEPS.ALERT_CONDITION:
        return (
          <div>
            <h3 style={styles.stepTitle}>🔔 알림 조건</h3>
            
            <div style={styles.summaryBox}>
              <div style={styles.summaryRow}>
                <span>🎯 목표:</span>
                <strong>{formData.content}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>📊 현재:</span>
                <strong style={{ color: colors.blue[600] }}>{formData.current_value}</strong>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: colors.gray[600], marginBottom: spacing.md }}>
              어떤 조건일 때 알림을 받고 싶으세요?
            </p>
            <textarea
              autoFocus
              value={formData.tracking_prompt}
              onChange={(e) => setFormData({ ...formData, tracking_prompt: e.target.value })}
              placeholder="예: 100개 이상이면 알림, 가격이 50달러 이하면 알림"
              style={{ ...styles.input, minHeight: '80px', resize: 'none' }}
              className="focus:border-blue-500"
            />
            <p style={styles.hint}>
              💡 주기적으로 확인하여 조건 충족 시 알림을 보내드립니다
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
      <div style={{ display: 'flex', gap: spacing.xs, marginBottom: spacing.xl }}>
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
            <span style={{ 
              fontSize: '9px', 
              color: index <= currentStep ? colors.blue[500] : colors.gray[400],
              whiteSpace: 'nowrap',
            }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div
        key={currentStep}
        style={{
          minHeight: '300px',
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
  previewBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.gray[100],
    borderRadius: '8px',
    fontSize: '11px',
    overflow: 'auto',
    maxHeight: '100px',
  } as React.CSSProperties,
  analysisBox: {
    padding: spacing.md,
    backgroundColor: '#e3f2fd',
    borderRadius: '8px',
    marginTop: spacing.sm,
  } as React.CSSProperties,
  targetInfo: {
    padding: spacing.sm,
    backgroundColor: colors.gray[100],
    borderRadius: '8px',
    marginBottom: spacing.lg,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    fontSize: '14px',
  } as React.CSSProperties,
  summaryBox: {
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: '12px',
    marginBottom: spacing.lg,
  } as React.CSSProperties,
  summaryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    fontSize: '14px',
    marginBottom: spacing.xs,
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
