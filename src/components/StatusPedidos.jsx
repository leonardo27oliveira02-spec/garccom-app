import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';

function StatusPedidos({ userData, onVoltar }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const pedidosProntosRef = useRef(new Set());
  const somPronto = useRef(new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='));

  useEffect(() => {
    carregarPedidos();

    // Subscrever para atualizações em tempo real
    const subscription = supabase
      .channel('pedidos-status-realtime')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos' },
        (payload) => {
          console.log('Pedido atualizado:', payload);
          
          // Tocar som quando pedido fica pronto
          if (payload.new.status === 'pronto' &&
              payload.old.status !== 'pronto' &&
              !pedidosProntosRef.current.has(payload.new.id)) {
            
            pedidosProntosRef.current.add(payload.new.id);
            somPronto.current.play().catch(e => console.log('Erro ao tocar som:', e));
            
            // Notificação visual no navegador
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('🍽️ Pedido Pronto!', {
                body: `Mesa ${payload.new.mesa?.numero || 'N/A'} está pronto para retirar!`,
                icon: '🍽️'
              });
            }
          }
          
          carregarPedidos();
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pedidos' },
        () => {
          carregarPedidos();
        }
      )
      .subscribe();

    // Pedir permissão para notificações
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Atualizar a cada 15 segundos como backup
    const interval = setInterval(() => {
      carregarPedidos();
    }, 15000);

    return () => {
      supabase.removeChannel(subscription);
      clearInterval(interval);
    };
  }, [userData]);

  const carregarPedidos = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          mesa:mesas(numero, id),
          garcom:usuarios(nome),
          itens:itens_pedido(nome_item, quantidade, preco_unitario)
        `)
        .eq('restaurante_id', userData.restaurante_id)
        .eq('garcom_id', userData.id)
        .in('status', ['em_preparo', 'pronto'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPedidos(data || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
    setLoading(false);
  };

  const entregarPedido = async (pedido) => {
    const confirmar = window.confirm(`Entregar pedido da Mesa ${pedido.mesa?.numero}?\n\nIsso vai marcar o pedido como entregue, mas a mesa continuará aberta.`);
    
    if (!confirmar) return;

    try {
      // Apenas marcar pedido como entregue (NÃO libera a mesa)
      const { error: pedidoError } = await supabase
        .from('pedidos')
        .update({ status: 'entregue' })
        .eq('id', pedido.id);

      if (pedidoError) throw pedidoError;

      alert('✅ Pedido entregue!');
      carregarPedidos();
    } catch (error) {
      console.error('Erro ao entregar pedido:', error);
      alert('❌ Erro ao entregar pedido!');
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'novo': 'Novo',
      'em_preparo': 'Em Preparo',
      'pronto': 'Pronto',
      'entregue': 'Entregue',
      'cancelado': 'Cancelado'
    };
    return labels[status] || status;
  };

  const calcularTempo = (createdAt) => {
    const agora = new Date();
    const criado = new Date(createdAt);
    const diff = Math.floor((agora - criado) / 1000 / 60); // minutos
    
    if (diff < 1) return 'Agora mesmo';
    if (diff === 1) return '1 min atrás';
    if (diff < 60) return `${diff} min atrás`;
    
    const horas = Math.floor(diff / 60);
    if (horas === 1) return '1 hora atrás';
    return `${horas} horas atrás`;
  };

  if (loading) {
    return (
      <div className="status-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Carregando pedidos...
        </div>
      </div>
    );
  }

  return (
    <div className="status-container">
      <div className="pedido-header">
        <h2 className="pedido-title">📋 Status dos Pedidos</h2>
        <button onClick={onVoltar} className="btn-voltar">
          ← Voltar
        </button>
      </div>

      <div className="status-list">
        {pedidos.length === 0 ? (
          <div className="carrinho-empty">
            Nenhum pedido ativo no momento
          </div>
        ) : (
          pedidos.map((pedido) => (
            <div key={pedido.id} className={`pedido-card ${pedido.status}`}>
              <div className="pedido-info">
                <div className="pedido-mesa">
                  Mesa {pedido.mesa?.numero || 'N/A'}
                </div>
                <div className={`pedido-status ${pedido.status}`}>
                  {getStatusLabel(pedido.status)}
                </div>
              </div>
              
              <div className="pedido-itens">
                {pedido.itens && pedido.itens.map((item, index) => (
                  <div key={index}>
                    • {item.quantidade}x {item.nome_item}
                  </div>
                ))}
              </div>

              <div className="pedido-info">
                <div className="pedido-tempo">
                  ⏱️ {calcularTempo(pedido.created_at)}
                </div>
                <div className="item-preco">
                  R$ {parseFloat(pedido.total).toFixed(2)}
                </div>
              </div>

              {pedido.status === 'pronto' && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ padding: '10px', background: '#5f27cd', color: 'white', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', marginBottom: '10px' }}>
                    ✨ Pedido pronto! Pode retirar!
                  </div>
                  <button 
                    onClick={() => entregarPedido(pedido)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ✅ Marcar como Entregue
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default StatusPedidos;