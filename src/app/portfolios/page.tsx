'use client';

import { Suspense } from 'react';
import { usePortfolios } from '@/hooks/usePortfolios';
import PageLayout from '@/components/PageLayout';
import PortfolioGrid from '@/components/PortfolioGrid';
import Loading from '@/components/Loading';
import Modal from '@/components/Modal';
import PortfolioWizard from '@/components/PortfolioWizard';
import PortfolioEditForm from '@/components/PortfolioEditForm';
import PushNotification from '@/components/PushNotification';

// 클라이언트 전용 컴포넌트 (Hydration 에러 방지)
function PortfoliosContent() {
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

  // 수정 모드일 때 초기 데이터 준비
  const initialData = editingPortfolio ? {
    title: editingPortfolio.title,
    content: editingPortfolio.content || '',
    tracking_url: editingPortfolio.tracking_url || '',
    tracking_prompt: editingPortfolio.tracking_prompt || '',
  } : null;

  return (
    <PageLayout title="">
      {loading ? (
        <Loading />
      ) : (
        <>
          <PushNotification portfolios={portfolios} />
          <PortfolioGrid
            portfolios={portfolios}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={openModal}
          />
        </>
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingPortfolio ? '포트폴리오 수정' : '새 포트폴리오'}
      >
        {editingPortfolio ? (
          <PortfolioEditForm
            portfolio={editingPortfolio}
            onSubmit={handleUpdate}
            onCancel={closeModal}
          />
        ) : (
          <PortfolioWizard
            onSubmit={handleCreate}
            onCancel={closeModal}
            initialData={null}
            isEditing={false}
          />
        )}
      </Modal>
    </PageLayout>
  );
}

export default function PortfoliosPage() {
  return (
    <Suspense fallback={
      <PageLayout title="">
        <Loading />
      </PageLayout>
    }>
      <PortfoliosContent />
    </Suspense>
  );
}
