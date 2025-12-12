import { useState } from 'react';
import { supabase } from '../services/supabase';
import { verificarResetDiario } from '../services/resetDiario';

function Login({ onLogin }) {
  const [nome, setNome] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!nome || !pin) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('nome', nome)
        .eq('pin', pin)
        .single();

      if (error) throw error;

      if (data) {
        // VERIFICAR RESET DIÁRIO
        await verificarResetDiario(data.restaurante_id);
        
        alert(`Bem-vindo, ${data.nome}!`);
        onLogin(data);
      }
    } catch (error) {
      console.error('Erro ao autenticar:', error);
      alert('Nome ou PIN incorretos!\n\nTente:\nGarçom → João Silva / 1234\nCozinha → Carlos / 9999');
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <div className="login-icon">🍽️</div>
        <h1 className="login-title">ComandaPro</h1>
        <p className="login-subtitle">Sistema de Pedidos Inteligente</p>
      </div>

      <div className="login-form">
        <div className="form-group">
          <label htmlFor="nome">Seu Nome</label>
          <input
            type="text"
            id="nome"
            placeholder="Digite seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="pin">PIN</label>
          <input
            type="password"
            id="pin"
            placeholder="Digite seu PIN (4 dígitos)"
            maxLength="4"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
        </div>

        <button 
          onClick={handleSubmit} 
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar →'}
        </button>
      </div>
    </div>
  );
}

export default Login;