import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeCode } from '@/lib/api';
import Icon from '@/components/ui/icon';

export default function YandexCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) {
      setError(true);
      return;
    }
    exchangeCode(code)
      .then(() => navigate('/', { replace: true }))
      .catch(() => setError(true));
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-grape via-coral to-sunset text-white font-sans">
      <div className="text-center px-8">
        {error ? (
          <>
            <Icon name="TriangleAlert" size={48} className="mx-auto mb-4" />
            <p className="font-display font-bold text-xl mb-4">Не удалось войти</p>
            <button onClick={() => navigate('/')} className="bg-white text-gray-900 font-bold px-6 py-3 rounded-2xl">На главную</button>
          </>
        ) : (
          <>
            <Icon name="LoaderCircle" size={48} className="mx-auto mb-4 animate-spin" />
            <p className="font-display font-bold text-xl">Входим через Яндекс ID...</p>
          </>
        )}
      </div>
    </div>
  );
}
