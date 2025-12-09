import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

function FecharMesa({ mesa, userData, onVoltar }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPedidosMesa();
  }, []);

  const carregarPedidosMesa = async () => {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        itens:itens_pedido(nome_item, quantidade, preco_unitario)
      `)
      .eq('mesa_id', mesa.id)
      .in('status', ['novo', 'em_preparo', 'pronto', 'entregue'])
      .order('created_at', { ascending: true });

    if (!error) {
      setPedidos(data || []);
    }
    setLoading(false);
  };

  const calcularTotal = () => {
    return pedidos.reduce((total, pedido) => total + parseFloat(pedido.total), 0);
  };

  const contarItens = () => {
    return pedidos.reduce((total, pedido) => {
      return total + (pedido.itens?.length || 0);
    }, 0);
  };

  const fecharMesa = async () => {
    const total = calcularTotal();
    const confirmar = window.confirm(
      `FECHAR MESA ${mesa.numero}?\n\n` +
      `Total: R$ ${total.toFixed(2)}\n` +
      `Itens: ${contarItens()}\n\n` +
      `Isso vai:\n` +
      `• Finalizar todos os pedidos\n` +
      `• Liberar a mesa\n` +
      `• Limpar histórico da mesa\n\n` +
      `Confirmar?`
    );

    if (!confirmar) return;

    try {
      // 1. Marcar todos os pedidos como "fechado" (para limpar histórico)
      for (const pedido of pedidos) {
        await supabase
          .from('pedidos')
          .update({ 
            status: 'fechado',
            updated_at: new Date().toISOString()
          })
          .eq('id', pedido.id);
      }

      // 2. Liberar mesa
      await supabase
        .from('mesas')
        .update({ status: 'livre' })
        .eq('id', mesa.id);

      alert(`✅ Mesa ${mesa.numero} fechada!\n\nTotal: R$ ${total.toFixed(2)}\n\nHistórico limpo e mesa liberada!`);
      onVoltar();
    } catch (error) {
      console.error('Erro ao fechar mesa:', error);
      alert('❌ Erro ao fechar mesa!');
    }
  };

  if (loading) {
    return (
      <div className="pedido-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Carregando comanda...
        </div>
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="pedido-container">
        <div className="pedido-header">
          <h2 className="pedido-title">🧾 Mesa {mesa.numero}</h2>
          <button onClick={onVoltar} className="btn-voltar">← Voltar</button>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          Nenhum pedido nesta mesa ainda
        </div>
      </div>
    );
  }

  return (
    <div className="pedido-container">
      <div className="pedido-header">
        <h2 className="pedido-title">🧾 Comanda - Mesa {mesa.numero}</h2>
        <button onClick={onVoltar} className="btn-voltar">← Voltar</button>
      </div>

      {/* Resumo */}
      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '15px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontWeight: '600', color: '#666' }}>Total de Pedidos:</span>
          <span style={{ fontWeight: 'bold' }}>{pedidos.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontWeight: '600', color: '#666' }}>Total de Itens:</span>
          <span style={{ fontWeight: 'bold' }}>{contarItens()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '15px', borderTop: '2px solid #e0e0e0' }}>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>TOTAL:</span>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b6b' }}>
            R$ {calcularTotal().toFixed(2)}
          </span>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '15px', color: '#333' }}>
          📋 Detalhamento
        </h3>

        {pedidos.map((pedido, index) => (
          <div key={pedido.id} style={{ 
            background: '#fff', 
            border: '2px solid #e0e0e0', 
            borderRadius: '10px', 
            padding: '15px',
            marginBottom: '15px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#666' }}>Pedido #{index + 1}</span>
              <span style={{ 
                padding: '3px 10px', 
                borderRadius: '15px', 
                fontSize: '11px', 
                fontWeight: 'bold',
                background: pedido.status === 'entregue' ? '#2ecc71' : 
                           pedido.status === 'pronto' ? '#5f27cd' :
                           pedido.status === 'em_preparo' ? '#ffd89b' : '#667eea',
                color: pedido.status === 'em_preparo' ? '#333' : 'white'
              }}>
                {pedido.status === 'novo' ? 'NOVO' :
                 pedido.status === 'em_preparo' ? 'EM PREPARO' :
                 pedido.status === 'pronto' ? 'PRONTO' : 'ENTREGUE'}
              </span>
            </div>

            {pedido.itens?.map((item, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: idx < pedido.itens.length - 1 ? '1px solid #f0f0f0' : 'none'
              }}>
                <span style={{ flex: 1 }}>
                  {item.quantidade}x {item.nome_item}
                </span>
                <span style={{ fontWeight: 'bold', color: '#ff6b6b' }}>
                  R$ {(item.quantidade * parseFloat(item.preco_unitario)).toFixed(2)}
                </span>
              </div>
            ))}

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginTop: '10px',
              paddingTop: '10px',
              borderTop: '2px solid #e0e0e0',
              fontWeight: 'bold'
            }}>
              <span>Subtotal:</span>
              <span style={{ color: '#ff6b6b' }}>R$ {parseFloat(pedido.total).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Botão Fechar */}
      <button 
        onClick={fecharMesa}
        style={{
          width: '100%',
          padding: '18px',
          background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '15px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 5px 15px rgba(46, 204, 113, 0.3)',
          transition: 'transform 0.2s'
        }}
        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
      >
        💰 FECHAR MESA - R$ {calcularTotal().toFixed(2)}
      </button>
    </div>
  );
}

export default FecharMesa;