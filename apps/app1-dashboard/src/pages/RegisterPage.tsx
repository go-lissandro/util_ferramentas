import { useEffect } from 'react';

// Registration is closed — accounts are created by admin after PIX payment approval
// Redirect anyone who lands on /register to the checkout page
export function RegisterPage() {
  useEffect(() => {
    window.location.href = '/checkout.html';
  }, []);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', color: 'var(--color-text-muted)', fontFamily: 'Inter, sans-serif' }}>
      Redirecionando para a página de planos...
    </div>
  );
}
