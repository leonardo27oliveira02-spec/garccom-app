import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

function PainelCozinha({ userData, onLogout }) {
  const [pedidosNovos, setPedidosNovos] = useState([]);
  const [pedidosEmPreparo, setPedidosEmPreparo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audio] = useState(new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZQQ0RWK3n7qlZEwlGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZQQ0RWK3n7qlZEwlGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZQQ0RWK3n7qlZEwlGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZQQ0RWK3n7qlZEwlGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZQQ0RWK3n7qlZEwlGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZQQ0RWK3n7qlZEwlGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZQQ0RWK3n7qlZEwlGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZQQ0RWK3n7qlZEwlGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZQQ0RWK3n7qlZEwlGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZQQ0RWK3n7qlZEwlGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZQQ0RWK3n7qlZEwlGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZQQ0RWK3n7qlZEwlGn+DyvmwhBzKJ0fPTgjMGHm7A7+OZQQ0RWK3n7qlZEw=='));

  useEffect(() => {
    carregarPedidos();

    // Subscrever para atualizações em tempo real
    const subscription = supabase
      .channel('cozinha-pedidos-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pedidos' },
        (payload) => {
          console.log('Novo pedido chegou!', payload);
          carregarPedidos();
          
          // Tocar som quando novo pedido chegar
          audio.play().catch(e => console.log('Erro ao tocar som:', e));
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos' },
        (payload) => {
          console.log('Pedido atualizado:', payload);
          carregarPedidos();
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'pedidos' },
        () => {
          carregarPedidos();
        }
      )
      .subscribe();

    // Atualizar a cada 30 segundos como backup
    const interval = setInterval(() => {
      carregarPedidos();
    }, 30000);

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
          mesa:mesas(numero),
          garcom:usuarios(nome),
          itens:itens_pedido(nome_item, quantidade, preco_unitario, observacoes)
        `)
        .eq('restaurante_id', userData.restaurante_id)
        .in('status', ['novo', 'em_preparo'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Separar por status
      setPedidosNovos(data?.filter(p => p.status === 'novo') || []);
      setPedidosEmPreparo(data?.filter(p => p.status === 'em_preparo') || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
    setLoading(false);
  };

  const iniciarPreparo = async (pedidoId) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ 
          status: 'em_preparo',
          updated_at: new Date().toISOString()
        })
        .eq('id', pedidoId);

      if (error) throw error;
      carregarPedidos();
    } catch (error) {
      console.error('Erro ao iniciar preparo:', error);
      alert('Erro ao atualizar status!');
    }
  };

  const marcarPronto = async (pedidoId) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: 'pronto' })
        .eq('id', pedidoId);

      if (error) throw error;
      carregarPedidos();
      alert('✅ Pedido marcado como pronto!');
    } catch (error) {
      console.error('Erro ao marcar como pronto:', error);
      alert('Erro ao atualizar status!');
    }
  };

  const calcularTempo = (pedido) => {
    const agora = new Date();
    // Se está em preparo, usar o updated_at (quando começou o preparo)
    // Se é novo, usar created_at
    const inicio = pedido.status === 'em_preparo' && pedido.updated_at 
      ? new Date(pedido.updated_at) 
      : new Date(pedido.created_at);
    
    const diff = Math.floor((agora - inicio) / 1000 / 60);
    return diff;
  };

  const CardPedido = ({ pedido, status }) => {
    const tempoMinutos = calcularTempo(pedido);
    const isAtrasado = tempoMinutos > 15;

    return (
      <div className={`pedido-card-cozinha ${isAtrasado ? 'atrasado' : ''}`}>
        <div className="pedido-cozinha-header">
          <div className="pedido-mesa-grande">
            🍽️ Mesa {pedido.mesa?.numero || 'N/A'}
          </div>
          <div className="pedido-tempo-cozinha">
            <span className={isAtrasado ? 'tempo-atrasado' : ''}>
              ⏱️ {tempoMinutos} min
            </span>
          </div>
        </div>

        <div className="pedido-garcom">
          Garçom: {pedido.garcom?.nome || 'N/A'}
        </div>

        {pedido.observacoes && (
          <div className="pedido-observacoes-destaque">
            📝 OBSERVAÇÃO: {pedido.observacoes}
          </div>
        )}

        <div className="pedido-itens-cozinha">
          {pedido.itens?.map((item, index) => (
            <div key={index} className="item-cozinha">
              <div className="item-quantidade">{item.quantidade}x</div>
              <div className="item-detalhe">
                <div className="item-nome-cozinha">{item.nome_item}</div>
                {item.observacoes && (
                  <div className="item-obs">📝 {item.observacoes}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {status === 'novo' && (
          <button 
            onClick={() => iniciarPreparo(pedido.id)}
            className="btn-iniciar-preparo"
          >
            🔥 Iniciar Preparo
          </button>
        )}

        {status === 'em_preparo' && (
          <button 
            onClick={() => marcarPronto(pedido.id)}
            className="btn-marcar-pronto"
          >
            ✅ Marcar como Pronto
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="cozinha-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Carregando pedidos...
        </div>
      </div>
    );
  }

  return (
    <div className="cozinha-container">
      <div className="cozinha-header">
        <h1 className="cozinha-title">🍳 Painel da Cozinha</h1>
        <div className="cozinha-info">
          <div className="cozinha-user">👨‍🍳 {userData.nome}</div>
          <button onClick={onLogout} className="btn-secondary btn-logout">
            🚪 Sair
          </button>
        </div>
      </div>

      <div className="cozinha-columns">
        {/* Coluna Novos */}
        <div className="cozinha-column">
          <div className="column-header novos">
            <h3>🆕 Novos Pedidos ({pedidosNovos.length})</h3>
          </div>
          <div className="column-content">
            {pedidosNovos.length === 0 ? (
              <div className="column-empty">
                Nenhum pedido novo
              </div>
            ) : (
              pedidosNovos.map(pedido => (
                <CardPedido key={pedido.id} pedido={pedido} status="novo" />
              ))
            )}
          </div>
        </div>

        {/* Coluna Em Preparo */}
        <div className="cozinha-column">
          <div className="column-header preparo">
            <h3>🔥 Em Preparo ({pedidosEmPreparo.length})</h3>
          </div>
          <div className="column-content">
            {pedidosEmPreparo.length === 0 ? (
              <div className="column-empty">
                Nenhum pedido em preparo
              </div>
            ) : (
              pedidosEmPreparo.map(pedido => (
                <CardPedido key={pedido.id} pedido={pedido} status="em_preparo" />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PainelCozinha;