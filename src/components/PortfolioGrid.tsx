import { Portfolio } from '@/types';
import { grid } from '@/styles/design-tokens';
import PortfolioCard from './PortfolioCard';
import AddCard from './AddCard';

interface PortfolioGridProps {
  portfolios: Portfolio[];
  onEdit: (portfolio: Portfolio) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export default function PortfolioGrid({ portfolios, onEdit, onDelete, onAdd }: PortfolioGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${grid.columns.default}, 1fr)`,
        gap: grid.gap,
      }}
      className="max-[640px]:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <AddCard onClick={onAdd} />
      {portfolios.map((portfolio) => (
        <PortfolioCard
          key={portfolio.id}
          portfolio={portfolio}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
