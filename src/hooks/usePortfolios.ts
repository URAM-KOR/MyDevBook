import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Portfolio } from '@/types';
import { PortfolioFormData as WizardFormData } from '@/components/PortfolioWizard';

export function usePortfolios() {
  const router = useRouter();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(false); // 초기값을 false로 변경 (서버/클라이언트 일치)
  const [showModal, setShowModal] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [mounted, setMounted] = useState(false);

  // 클라이언트에서만 마운트 확인
  useEffect(() => {
    setMounted(true);
    setLoading(true); // 마운트 후에만 로딩 시작
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

      const apiUrl = `/api/portfolios?user_id=${userId}`;
      console.log('[Portfolios] Fetching:', { userId, apiUrl });
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('[Portfolios] Response:', { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText 
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Portfolios] Data received:', { 
          count: data?.length || 0,
          userId,
          portfolios: data 
        });
        setPortfolios(data || []);
      } else if (response.status === 401) {
        console.warn('[Portfolios] Unauthorized, redirecting');
        localStorage.removeItem('token');
        router.push('/');
      } else {
        console.error('[Portfolios] Error:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('[Portfolios] Error details:', errorData);
        setPortfolios([]);
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
          current_value: wizardData.current_value || null,
          target_key: wizardData.content || null,
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

  const handleUpdate = async (wizardData: WizardFormData) => {
    const token = localStorage.getItem('token');
    if (!token || !editingPortfolio) return;

    try {
      const response = await fetch(`/api/portfolios/${editingPortfolio.id}`, {
        method: 'PUT',
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
        setEditingPortfolio(null);
        fetchPortfolios();
      }
    } catch (error) {
      console.error('Failed to update portfolio:', error);
    }
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
    loading: loading, // 마운트 전에는 false (서버와 동일)
    showModal,
    editingPortfolio,
    handleCreate,
    handleUpdate,
    handleEdit,
    handleDelete,
    openModal,
    closeModal,
  };
}
