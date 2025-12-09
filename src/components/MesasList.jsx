import { useState, useEffect } from 'react';
import { buscarMesas, supabase } from '../services/supabase';

function MesasList({ userData, onSelectMesa, onVerStatus, onAdmin, onFecharMesa, onGerenciarEquipe, onLogout }) {
  const [mesas, setMesas] = useState([]);
  const [pedidosAtivos, setPedidosAtivos] = useState(0);
  const [stats, setStats] = useState({ total: 0, itens: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarMesas();
    carregarPedidosAtivos();
    carregarStats();
    
    // Subscrever para atualizações em tempo real
    const subscription = supabase
      .channel('mesas-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'mesas' },
        () => {
          carregarMesas();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => {
          carregarPedidosAtivos();
          carregarStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userData]);

  const carregarStats = async () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('pedidos')
      .select('total, itens:itens_pedido(id)')
      .eq('garcom_id', userData.id)
      .gte('created_at', hoje.toISOString());
    
    if (!error && data) {
      const totalVendido = data.reduce((sum, p) => sum + parseFloat(p.total), 0);
      const totalItens = data.reduce((sum, p) => sum + (p.itens?.length || 0), 0);
      setStats({ total: totalVendido, itens: totalItens });
    }
  };

  const carregarPedidosAtivos = async () => {
    const { data, error } = await supabase
      .from('pedidos')
      .select('id', { count: 'exact' })
      .eq('restaurante_id', userData.restaurante_id)
      .neq('status', 'entregue');
    
    if (!error) {
      setPedidosAtivos(data?.length || 0);
    }
  };

  const carregarMesas = async () => {
    const result = await buscarMesas(userData.restaurante_id);
    if (result.success) {
      setMesas(result.data);
    }
    setLoading(false);
  };

  const getStatusLabel = (status) => {
    const labels = {
      livre: 'Livre',
      ocupada: 'Ocupada',
      pedido_pendente: 'Pedido Pendente'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="mesas-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Carregando mesas...
        </div>
      </div>
    );
  }

  return (
    <div className="mesas-container">
      <div className="mesas-header">
        <div className="user-info">
          <div className="user-name">👋 Olá, {userData.nome}!</div>
          <div className="user-role">Garçom</div>
        </div>
        <div className="header-actions">
          <button onClick={onVerStatus} className="btn-secondary">
            📋 Pedidos {pedidosAtivos > 0 && `(${pedidosAtivos})`}
          </button>
          <button onClick={onLogout} className="btn-secondary btn-logout">
            🚪 Sair
          </button>
        </div>
      </div>

      {/* DASHBOARD */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px',
          borderRadius: '15px',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>💰 Vendido Hoje</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>R$ {stats.total.toFixed(2)}</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          padding: '20px',
          borderRadius: '15px',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>🍔 Itens Vendidos</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stats.itens}</div>
        </div>
      </div>

      <div style={{ marginBottom: '20px', textAlign: 'center', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button 
          onClick={onAdmin}
          className="btn-secondary"
          style={{ padding: '12px 30px', fontSize: '14px' }}
        >
          ⚙️ Cardápio
        </button>
        <button 
          onClick={onGerenciarEquipe}
          className="btn-secondary"
          style={{ padding: '12px 30px', fontSize: '14px' }}
        >
          👥 Equipe
        </button>
      </div>

      <div className="mesas-grid">
        {mesas.map((mesa) => (
          <div key={mesa.id} style={{ position: 'relative' }}>
            <button
              className={`mesa-card ${mesa.status}`}
              onClick={() => onSelectMesa(mesa)}
            >
              <div className="mesa-numero">Mesa {mesa.numero}</div>
              <div className="mesa-status">{getStatusLabel(mesa.status)}</div>
            </button>
            {mesa.status !== 'livre' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFecharMesa(mesa);
                }}
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '5px 15px',
                  background: '#2ecc71',
                  color: 'white',
                  border: 'none',
                  borderRadius: '15px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
              >
                💰 Fechar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MesasList;