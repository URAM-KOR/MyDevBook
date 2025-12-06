interface PortfolioFormData {
  title: string;
  content: string;
  image_url: string;
  order: number;
}

interface PortfolioFormProps {
  formData: PortfolioFormData;
  setFormData: (data: PortfolioFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
}

export default function PortfolioForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isEditing,
}: PortfolioFormProps) {
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-14">
      <h2 className="text-xl font-semibold mb-4">
        {isEditing ? '포트폴리오 수정' : '새 포트폴리오 등록'}
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            제목 *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            내용
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={4}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            이미지 URL (선택)
          </label>
          <input
            type="url"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="이미지 URL을 입력하세요 (없으면 제목 기반 이미지 생성)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            순서
          </label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {isEditing ? '수정' : '등록'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

