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
    editingPortfolio,
    handleCreate,
    handleUpdate,
    handleEdit,
    handleDelete,
    openModal,
    closeModal,
  } = usePortfolios();

  if (loading) {
    return <Loading />;
  }

  // 수정 모드일 때 초기 데이터 준비
  const initialData = editingPortfolio ? {
    title: editingPortfolio.title,
    content: editingPortfolio.content || '',
    tracking_url: editingPortfolio.tracking_url || '',
    tracking_prompt: editingPortfolio.tracking_prompt || '',
  } : null;

  return (
    <PageLayout title="My Dev Books">
      <PortfolioGrid
        portfolios={portfolios}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={openModal}
      />

      <Modal 
        isOpen={showModal} 
        onClose={closeModal}
        title={editingPortfolio ? '포트폴리오 수정' : '새 포트폴리오'}
      >
        <PortfolioWizard 
          onSubmit={editingPortfolio ? handleUpdate : handleCreate} 
          onCancel={closeModal}
          initialData={initialData}
          isEditing={!!editingPortfolio}
        />
      </Modal>
    </PageLayout>
  );
}
