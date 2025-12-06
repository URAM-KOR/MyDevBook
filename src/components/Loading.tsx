interface LoadingProps {
  message?: string;
}

export default function Loading({ message = '로딩 중...' }: LoadingProps) {
  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <p className="text-gray-600">{message}</p>
    </div>
  );
}

