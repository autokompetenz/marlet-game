import { useEffect, useRef } from 'react';
import { useAuth } from '../store';
import { useNavigate } from 'react-router-dom';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function GoogleLogin() {
  const btnRef = useRef(null);
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!CLIENT_ID || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async (response) => {
        try {
          await googleLogin(response.credential);
          navigate('/');
        } catch (err) {
          alert('Erreur de connexion Google');
        }
      },
    });

    window.google.accounts.id.renderButton(btnRef.current, {
      theme: 'outline',
      size: 'large',
      width: 360,
    });
  }, []);

  if (!CLIENT_ID) return null;

  return <div ref={btnRef} style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }} />;
}
