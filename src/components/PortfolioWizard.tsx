import { useState } from 'react';
import { colors, spacing, card, button, typography } from '@/styles/design-tokens';

interface PortfolioWizardProps {
  onSubmit: (data: PortfolioFormData) => void;
  onCancel: () => void;
}

export interface PortfolioFormData {
  title: string;
  content: string;
  tracking_url: string;
  tracking_prompt: string;
}

const steps = [
  { key: 'title', label: '포트폴리오 이름', placeholder: '예: 내 GitHub 프로젝트' },
  { key: 'content', label: '목표 또는 목적', placeholder: '예: 스타 1000개 달성하기' },
  { key: 'tracking_url', label: '추적할 API URL', placeholder: '예: https://api.github.com/repos/...' },
  { key: 'tracking_prompt', label: '추적할 값/상태 프롬프트', placeholder: '예: stargazers_count 값을 추적해줘' },
];

export default function PortfolioWizard({ onSubmit, onCancel }: PortfolioWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<PortfolioFormData>({
    title: '',
    content: '',
    tracking_url: '',
    tracking_prompt: '',
  });
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const currentField = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onSubmit(formData);
    } else {
      setDirection('next');
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setDirection('prev');
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && formData[currentField.key as keyof PortfolioFormData]) {
      handleNext();
    }
  };

  const currentValue = formData[currentField.key as keyof PortfolioFormData];

  return (
    <div style={{ padding: spacing.xl, paddingTop: '48px' }}>
      {/* Progress indicator */}
      <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.xl }}>
        {steps.map((_, index) => (
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
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          key={currentStep}
          style={{
            animation: `slideIn${direction === 'next' ? 'Right' : 'Left'} 300ms ease-out`,
          }}
        >
          <p
            style={{
              fontSize: '14px',
              color: colors.gray[500],
              marginBottom: spacing.sm,
            }}
          >
            {currentStep + 1} / {steps.length}
          </p>
          <h3
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: colors.gray[800],
              marginBottom: spacing.lg,
            }}
          >
            {currentField.label}
          </h3>
          {currentField.key === 'content' || currentField.key === 'tracking_prompt' ? (
            <textarea
              autoFocus
              value={currentValue}
              onChange={(e) =>
                setFormData({ ...formData, [currentField.key]: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, [currentField.key]: e.target.value })
              }
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
        </div>
      </div>

      {/* Navigation buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: spacing.xl,
        }}
      >
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
          disabled={!currentValue && currentStep === 0}
          style={{
            padding: `${spacing.sm} ${spacing.lg}`,
            backgroundColor: currentValue || currentStep > 0 ? colors.blue[500] : colors.gray[300],
            color: 'white',
            borderRadius: button.borderRadius,
            border: 'none',
            cursor: currentValue || currentStep > 0 ? 'pointer' : 'not-allowed',
            fontSize: '16px',
          }}
          className={currentValue || currentStep > 0 ? 'hover:bg-blue-600' : ''}
        >
          {isLastStep ? '완료' : '다음'}
        </button>
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

