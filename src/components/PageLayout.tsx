import { container, spacing, colors } from '@/styles/design-tokens';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

export default function PageLayout({ children, title, actionButton }: PageLayoutProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: container.padding,
        backgroundColor: colors.gray[50],
      }}
    >
      <div
        style={{
          maxWidth: container.maxWidth,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.section,
          }}
        >
          <h1
            style={{
              fontSize: '30px',
              fontWeight: 700,
              color: colors.gray[800],
            }}
          >
            {title}
          </h1>
          {actionButton && (
            <button
              onClick={actionButton.onClick}
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                backgroundColor: colors.primary,
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
              }}
              className="hover:bg-blue-700"
            >
              {actionButton.label}
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
