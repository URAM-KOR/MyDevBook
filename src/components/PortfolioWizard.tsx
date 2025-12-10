import { useState } from 'react';
import { colors, spacing, button, typography } from '@/styles/design-tokens';

interface InitialData {
  title?: string;
  content?: string;
  tracking_url?: string;
  tracking_prompt?: string;
  auth_type?: 'none' | 'github' | 'bearer';
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
  tracking_prompt: string;
  auth_token?: string;
  auth_type?: 'none' | 'github' | 'bearer';
}

interface TestResult {
  success: boolean;
  step?: string;
  error?: string;
  errorType?: string;
  emoji?: string;
  title?: string;
  description?: string;
  suggestion?: string;
  detail?: string;
  statusCode?: number;
  result?: {
    status: string;
    analysis: string;
    urlDataPreview: string;
    urlDataLength?: number;
  };
}

const inputSteps = [
  { key: 'title', label: '포트폴리오 이름', placeholder: '예: 내 GitHub 프로젝트' },
  { key: 'content', label: '목표 또는 목적', placeholder: '예: 스타 1000개 달성하기' },
  { key: 'tracking_url', label: '추적할 API URL', placeholder: '예: https://api.github.com/repos/...' },
  { key: 'tracking_prompt', label: '추적할 값/상태 프롬프트', placeholder: '예: stargazers_count 값이 100 이상이면 알려줘' },
];

// URL 타입 감지
function detectUrlType(url: string): 'github-api' | 'github-web' | 'other' {
  if (url.includes('api.github.com')) {
    return 'github-api';  // API - 토큰 인증 가능
  }
  if (url.includes('github.com')) {
    return 'github-web';  // 웹 페이지 - 토큰 인증 불가
  }
  return 'other';
}

export default function PortfolioWizard({ onSubmit, onCancel, initialData, isEditing }: PortfolioWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<PortfolioFormData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    tracking_url: initialData?.tracking_url || '',
    tracking_prompt: initialData?.tracking_prompt || '',
    auth_token: '', // 토큰은 보안상 다시 입력
    auth_type: initialData?.auth_type || 'none',
  });
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showAuthOption, setShowAuthOption] = useState(
    initialData?.auth_type === 'github' || initialData?.auth_type === 'bearer'
  );
  
  const urlType = detectUrlType(formData.tracking_url);
  const isGitHubApi = urlType === 'github-api';
  const isGitHubWeb = urlType === 'github-web';

  const hasTracking = formData.tracking_url && formData.tracking_prompt;
  const totalSteps = hasTracking ? inputSteps.length + 1 : inputSteps.length;
  const isTestStep = hasTracking && currentStep === inputSteps.length;
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;
  const currentField = inputSteps[currentStep];

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tracking/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: formData.tracking_url,
          prompt: formData.tracking_prompt,
          auth_token: formData.auth_token || null,
          auth_type: formData.auth_type || 'none',
        }),
      });

      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        error: '테스트 실행 중 오류가 발생했습니다.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      onSubmit(formData);
    } else {
      setDirection('next');
      setCurrentStep((prev) => prev + 1);
      
      // 테스트 단계로 이동하면 자동 실행
      if (hasTracking && currentStep === inputSteps.length - 1) {
        setTimeout(runTest, 500);
      }
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setDirection('prev');
      setCurrentStep((prev) => prev - 1);
      setTestResult(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentField && formData[currentField.key as keyof PortfolioFormData]) {
      handleNext();
    }
  };

  const currentValue = currentField ? formData[currentField.key as keyof PortfolioFormData] : '';

  return (
    <div style={{ padding: spacing.xl, paddingTop: '48px' }}>
      {/* Progress indicator */}
      <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.xl }}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              backgroundColor: index <= currentStep ? colors.blue[500] : colors.gray[200],
              transition: 'background-color 300ms',
            }}
          />
        ))}
      </div>

      {/* Step content */}
      <div
        style={{
          minHeight: '250px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {isTestStep ? (
          // 테스트 단계
          <div
            key="test"
            style={{
              animation: `slideIn${direction === 'next' ? 'Right' : 'Left'} 300ms ease-out`,
            }}
          >
            <p style={{ fontSize: '14px', color: colors.gray[500], marginBottom: spacing.sm }}>
              {currentStep + 1} / {totalSteps}
            </p>
            <h3 style={{ fontSize: '24px', fontWeight: 600, color: colors.gray[800], marginBottom: spacing.lg }}>
              🧪 추적 테스트
            </h3>

            {testing ? (
              <div style={{ textAlign: 'center', padding: spacing.xl }}>
                <div className="spinner" style={{ margin: '0 auto 16px' }} />
                <p style={{ color: colors.gray[600] }}>API 확인 중...</p>
              </div>
            ) : testResult ? (
              <div
                style={{
                  padding: spacing.md,
                  borderRadius: '12px',
                  backgroundColor: testResult.success ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${testResult.success ? '#10b981' : '#ef4444'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                  <span style={{ fontSize: '24px' }}>{testResult.success ? '✅' : (testResult.emoji || '❌')}</span>
                  <strong style={{ color: testResult.success ? '#059669' : '#dc2626' }}>
                    {testResult.success ? '테스트 성공!' : (testResult.title || '테스트 실패')}
                  </strong>
                </div>
                
                {testResult.success && testResult.result ? (
                  <div style={{ fontSize: '14px', color: colors.gray[700] }}>
                    <p style={{ marginBottom: spacing.sm }}>
                      <strong>분석 결과:</strong> {testResult.result.analysis}
                    </p>
                    <details style={{ marginTop: spacing.sm }}>
                      <summary style={{ cursor: 'pointer', color: colors.gray[500] }}>
                        API 응답 미리보기 ({testResult.result.urlDataLength?.toLocaleString()} bytes)
                      </summary>
                      <pre style={{
                        marginTop: spacing.sm,
                        padding: spacing.sm,
                        backgroundColor: colors.gray[100],
                        borderRadius: '8px',
                        fontSize: '12px',
                        overflow: 'auto',
                        maxHeight: '100px',
                      }}>
                        {testResult.result.urlDataPreview}
                      </pre>
                    </details>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px' }}>
                    {/* 에러 타입별 상세 표시 */}
                    {testResult.title && (
                      <div style={{ marginBottom: spacing.sm }}>
                        <span style={{ fontSize: '20px', marginRight: spacing.xs }}>{testResult.emoji}</span>
                        <strong style={{ color: '#dc2626' }}>{testResult.title}</strong>
                        {testResult.statusCode && (
                          <span style={{ color: colors.gray[500], marginLeft: spacing.sm }}>
                            (HTTP {testResult.statusCode})
                          </span>
                        )}
                      </div>
                    )}
                    <p style={{ color: colors.gray[700], marginBottom: spacing.sm }}>
                      {testResult.description || testResult.error}
                    </p>
                    {testResult.suggestion && (
                      <p style={{ 
                        color: colors.blue[600], 
                        backgroundColor: colors.blue[50],
                        padding: spacing.sm,
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}>
                        💡 {testResult.suggestion}
                      </p>
                    )}
                    {testResult.detail && (
                      <details style={{ marginTop: spacing.sm }}>
                        <summary style={{ cursor: 'pointer', color: colors.gray[400], fontSize: '12px' }}>
                          상세 오류 정보
                        </summary>
                        <pre style={{
                          marginTop: spacing.xs,
                          padding: spacing.sm,
                          backgroundColor: colors.gray[100],
                          borderRadius: '8px',
                          fontSize: '11px',
                          overflow: 'auto',
                          color: colors.gray[600],
                        }}>
                          {testResult.detail}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                <button
                  onClick={runTest}
                  style={{
                    marginTop: spacing.md,
                    padding: `${spacing.xs} ${spacing.md}`,
                    backgroundColor: colors.gray[200],
                    color: colors.gray[700],
                    borderRadius: button.borderRadius,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  🔄 다시 테스트
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: colors.gray[500] }}>
                <p>테스트를 시작합니다...</p>
              </div>
            )}
          </div>
        ) : (
          // 입력 단계
          <div
            key={currentStep}
            style={{
              animation: `slideIn${direction === 'next' ? 'Right' : 'Left'} 300ms ease-out`,
            }}
          >
            <p style={{ fontSize: '14px', color: colors.gray[500], marginBottom: spacing.sm }}>
              {currentStep + 1} / {totalSteps}
            </p>
            <h3 style={{ fontSize: '24px', fontWeight: 600, color: colors.gray[800], marginBottom: spacing.lg }}>
              {currentField.label}
            </h3>
            {currentField.key === 'content' || currentField.key === 'tracking_prompt' ? (
              <textarea
                autoFocus
                value={currentValue}
                onChange={(e) => setFormData({ ...formData, [currentField.key]: e.target.value })}
                placeholder={currentField.placeholder}
                style={{
                  width: '100%',
                  padding: spacing.md,
                  fontSize: typography.title.size,
                  border: `2px solid ${colors.gray[200]}`,
                  borderRadius: button.borderRadius,
                  outline: 'none',
                  resize: 'none',
                  minHeight: '100px',
                }}
                className="focus:border-blue-500"
              />
            ) : (
              <input
                autoFocus
                type={currentField.key === 'tracking_url' ? 'url' : 'text'}
                value={currentValue}
                onChange={(e) => setFormData({ ...formData, [currentField.key]: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder={currentField.placeholder}
                style={{
                  width: '100%',
                  padding: spacing.md,
                  fontSize: typography.title.size,
                  border: `2px solid ${colors.gray[200]}`,
                  borderRadius: button.borderRadius,
                  outline: 'none',
                }}
                className="focus:border-blue-500"
              />
            )}
            
            {/* GitHub 웹 페이지 감지 시 안내 */}
            {currentField.key === 'tracking_url' && formData.tracking_url && isGitHubWeb && (
              <div style={{
                marginTop: spacing.md,
                padding: spacing.md,
                backgroundColor: '#e8f5e9',
                borderRadius: '12px',
                border: '1px solid #a5d6a7',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                  <span style={{ fontSize: '20px' }}>🌐</span>
                  <strong style={{ color: colors.gray[800], fontSize: '14px' }}>GitHub 웹 페이지</strong>
                </div>
                <p style={{ fontSize: '12px', color: colors.gray[600], marginTop: spacing.sm }}>
                  웹 페이지 내용을 읽어서 GPT가 분석합니다.<br/>
                  Public 레포는 인증 없이 접근 가능합니다.
                </p>
                <p style={{ fontSize: '11px', color: colors.gray[500], marginTop: spacing.xs }}>
                  💡 더 정확한 데이터를 원하면 API URL 사용을 권장합니다:<br/>
                  <code style={{ backgroundColor: colors.gray[100], padding: '2px 4px', borderRadius: '4px' }}>
                    api.github.com/repos/owner/repo
                  </code>
                </p>
              </div>
            )}
            
            {/* GitHub API 감지 시 인증 옵션 */}
            {currentField.key === 'tracking_url' && formData.tracking_url && isGitHubApi && (
              <div style={{
                marginTop: spacing.md,
                padding: spacing.md,
                backgroundColor: '#f6f8fa',
                borderRadius: '12px',
                border: '1px solid #d0d7de',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                  <span style={{ fontSize: '20px' }}>🔗</span>
                  <strong style={{ color: colors.gray[800], fontSize: '14px' }}>GitHub API 감지됨</strong>
                </div>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showAuthOption}
                    onChange={(e) => {
                      setShowAuthOption(e.target.checked);
                      if (!e.target.checked) {
                        setFormData({ ...formData, auth_token: '', auth_type: 'none' });
                      } else {
                        setFormData({ ...formData, auth_type: 'github' });
                      }
                    }}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '14px', color: colors.gray[700] }}>
                    프라이빗 레포입니다 (토큰 필요)
                  </span>
                </label>
                
                {showAuthOption && (
                  <div style={{ marginTop: spacing.sm }}>
                    <input
                      type="password"
                      value={formData.auth_token || ''}
                      onChange={(e) => setFormData({ ...formData, auth_token: e.target.value })}
                      placeholder="ghp_xxxx... 또는 github_pat_xxxx..."
                      style={{
                        width: '100%',
                        padding: spacing.sm,
                        fontSize: '14px',
                        border: `1px solid ${colors.gray[300]}`,
                        borderRadius: button.borderRadius,
                        outline: 'none',
                        fontFamily: 'monospace',
                      }}
                      className="focus:border-blue-500"
                    />
                    <div style={{ 
                      fontSize: '11px', 
                      color: colors.gray[600], 
                      marginTop: spacing.sm,
                      backgroundColor: '#fff8e1',
                      padding: spacing.sm,
                      borderRadius: '8px',
                      border: '1px solid #ffe082',
                    }}>
                      <p style={{ fontWeight: 600, marginBottom: '4px' }}>📋 토큰 발급 방법:</p>
                      <ol style={{ margin: 0, paddingLeft: '16px', lineHeight: 1.6 }}>
                        <li>GitHub → <strong>Settings</strong></li>
                        <li>Developer Settings → <strong>Personal access tokens</strong></li>
                        <li><strong>Fine-grained tokens</strong> → Generate new token</li>
                        <li>Repository access → <strong>Only select repositories</strong></li>
                        <li>Permissions → Contents → <strong>Read-only</strong></li>
                      </ol>
                      <p style={{ marginTop: '6px', color: colors.gray[500] }}>
                        ⚠️ Deploy Key(SSH)는 API 호출에 사용할 수 없습니다
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* 스킵 안내 (URL, 프롬프트 단계) */}
            {(currentField.key === 'tracking_url' || currentField.key === 'tracking_prompt') && (
              <p style={{ fontSize: '12px', color: colors.gray[400], marginTop: spacing.sm }}>
                💡 나중에 설정하려면 비워두고 다음으로
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: spacing.xl }}>
        <button
          onClick={isFirstStep ? onCancel : handlePrev}
          style={{
            padding: `${spacing.sm} ${spacing.lg}`,
            backgroundColor: colors.gray[100],
            color: colors.gray[600],
            borderRadius: button.borderRadius,
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
          }}
          className="hover:bg-gray-200"
        >
          {isFirstStep ? '취소' : '이전'}
        </button>
        <button
          onClick={handleNext}
          disabled={(!currentValue && currentStep === 0) || testing}
          style={{
            padding: `${spacing.sm} ${spacing.lg}`,
            backgroundColor: (currentValue || currentStep > 0) && !testing ? colors.blue[500] : colors.gray[300],
            color: 'white',
            borderRadius: button.borderRadius,
            border: 'none',
            cursor: (currentValue || currentStep > 0) && !testing ? 'pointer' : 'not-allowed',
            fontSize: '16px',
          }}
          className={(currentValue || currentStep > 0) && !testing ? 'hover:bg-blue-600' : ''}
        >
          {testing ? '테스트 중...' : isLastStep ? '✓ 완료' : '다음'}
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
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid ${colors.gray[200]};
          border-top-color: ${colors.blue[500]};
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
