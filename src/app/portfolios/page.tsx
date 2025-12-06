'use client';

import { usePortfolios } from '@/hooks/usePortfolios';
import PageLayout from '@/components/PageLayout';
import PortfolioGrid from '@/components/PortfolioGrid';
import Loading from '@/components/Loading';
import Modal from '@/components/Modal';
import PortfolioWizard from '@/components/PortfolioWizard';

export default function PortfoliosPage() {
  const {
    portfolios,
    loading,
    showModal,
    handleCreate,
    handleEdit,
    handleDelete,
    openModal,
    closeModal,
  } = usePortfolios();

  if (loading) {
    return <Loading />;
  }

  return (
    <PageLayout title="My Dev Books">
      <PortfolioGrid
        portfolios={portfolios}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={openModal}
      />

      <Modal isOpen={showModal} onClose={closeModal}>
        <PortfolioWizard onSubmit={handleCreate} onCancel={closeModal} />
      </Modal>
    </PageLayout>
  );
}
