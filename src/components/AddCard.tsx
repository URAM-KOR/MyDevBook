import { card, cardStyles, colors, spacing } from '@/styles/design-tokens';

interface AddCardProps {
  onClick: () => void;
}

export default function AddCard({ onClick }: AddCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        minWidth: card.minWidth,
        minHeight: card.minHeight,
        borderRadius: card.borderRadius,
        boxShadow: cardStyles.base.boxShadow,
        transition: cardStyles.base.transition,
        backgroundColor: 'white',
        border: `2px dashed ${colors.gray[300]}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
      className="hover:shadow-lg hover:border-blue-400 hover:bg-blue-50 group"
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            margin: '0 auto',
            marginBottom: spacing.md,
            borderRadius: '50%',
            backgroundColor: colors.gray[100],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="group-hover:bg-blue-100 transition-colors"
        >
          <svg
            style={{ width: '32px', height: '32px', color: colors.gray[400] }}
            className="group-hover:text-blue-500 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
        <p
          style={{ color: colors.gray[500], fontWeight: 500 }}
          className="group-hover:text-blue-600 transition-colors"
        >
          새 포트폴리오
        </p>
      </div>
    </button>
  );
}
