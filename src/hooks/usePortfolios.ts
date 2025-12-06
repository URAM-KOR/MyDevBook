import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Portfolio } from '@/types';
import { PortfolioFormData as WizardFormData } from '@/components/PortfolioWizard';

export function usePortfolios() {
  const router = useRouter();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;

      const response = await fetch(`/api/portfolios?user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolios(data);
      } else if (response.status === 401) {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to fetch portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (wizardData: WizardFormData) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: wizardData.title,
          content: wizardData.content,
          tracking_url: wizardData.tracking_url,
          tracking_prompt: wizardData.tracking_prompt,
        }),
      });

      if (response.ok) {
        setShowModal(false);
        fetchPortfolios();
      }
    } catch (error) {
      console.error('Failed to create portfolio:', error);
    }
  };

  const handleEdit = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`/api/portfolios/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchPortfolios();
      }
    } catch (error) {
      console.error('Failed to delete portfolio:', error);
    }
  };

  const openModal = () => {
    setEditingPortfolio(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPortfolio(null);
  };

  return {
    portfolios,
    loading,
    showModal,
    editingPortfolio,
    handleCreate,
    handleEdit,
    handleDelete,
    openModal,
    closeModal,
  };
}
