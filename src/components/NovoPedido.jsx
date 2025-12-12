import { useState, useEffect } from 'react';
import { buscarCardapio, supabase } from '../services/supabase';

function NovoPedido({ mesa, userData, onVoltar }) {
  const [cardapio, setCardapio] = useState({
    entradas: [],
    pratos: [],
    bebidas: [],
    sobremesas: []
  });
  const [carrinho, setCarrinho] = useState([]);
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    carregarCardapio();
  }, []);

  const carregarCardapio = async () => {
    const result = await buscarCardapio(userData.restaurante_id);
    if (result.success) {
      // Agrupar por categoria
      const agrupado = {
        entradas: result.data.filter(item => item.categoria === 'entradas'),
        pratos: result.data.filter(item => item.categoria === 'pratos'),
        bebidas: result.data.filter(item => item.categoria === 'bebidas'),
        sobremesas: result.data.filter(item => item.categoria === 'sobremesas')
      };
      setCardapio(agrupado);
    }
    setLoading(false);
  };

  const adicionarItem = (item) => {
    setCarrinho([...carrinho, item]);
  };

  const removerItem = (index) => {
    const novoCarrinho = carrinho.filter((_, i) => i !== index);
    setCarrinho(novoCarrinho);
  };

  const calcularTotal = () => {
    return carrinho.reduce((total, item) => total + parseFloat(item.preco), 0);
  };

  const enviarPedido = async () => {
    if (carrinho.length === 0) {
      alert('Adicione pelo menos um item ao pedido!');
      return;
    }

    setEnviando(true);

    try {
      // Separar bebidas de comidas
      const bebidas = carrinho.filter(item => item.categoria === 'bebidas');
      const comidas = carrinho.filter(item => item.categoria !== 'bebidas');

      // Se só tem bebidas, vai direto como "pronto"
      if (bebidas.length > 0 && comidas.length === 0) {
        const { data: pedidoData, error: pedidoError } = await supabase
          .from('pedidos')
          .insert([{
            restaurante_id: userData.restaurante_id,
            mesa_id: mesa.id,
            garcom_id: userData.id,
            total: calcularTotal(),
            status: 'pronto',
            observacoes: observacoes || '🥤 Bebidas - Pronto para retirar'
          }])
          .select()
          .single();

        if (pedidoError) throw pedidoError;

        const itens = bebidas.map(item => ({
          pedido_id: pedidoData.id,
          cardapio_id: item.id,
          nome_item: item.nome,
          quantidade: 1,
          preco_unitario: item.preco
        }));

        await supabase.from('itens_pedido').insert(itens);
        await supabase.from('mesas').update({ status: 'pedido_pendente' }).eq('id', mesa.id);

        alert(`✅ Pedido de BEBIDAS enviado!\n\n🥤 Pronto para retirar no bar!\n\nMesa ${mesa.numero}\nTotal: R$ ${calcularTotal().toFixed(2)}`);
        onVoltar();
        setEnviando(false);
        return;
      }

      // Se tem comida (com ou sem bebidas), vai para cozinha como "novo"
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .insert([{
          restaurante_id: userData.restaurante_id,
          mesa_id: mesa.id,
          garcom_id: userData.id,
          total: calcularTotal(),
          status: 'novo',
          observacoes: observacoes || null
        }])
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      const itens = carrinho.map(item => ({
        pedido_id: pedidoData.id,
        cardapio_id: item.id,
        nome_item: item.nome,
        quantidade: 1,
        preco_unitario: item.preco
      }));

      await supabase.from('itens_pedido').insert(itens);
      await supabase.from('mesas').update({ status: 'ocupada' }).eq('id', mesa.id);      const mensagem = bebidas.length > 0 
        ? `✅ Pedido enviado para COZINHA!\n\n🍔 ${comidas.length} comidas\n🥤 ${bebidas.length} bebidas\n\nMesa ${mesa.numero}\nTotal: R$ ${calcularTotal().toFixed(2)}`
        : `✅ Pedido enviado para COZINHA!\n\nMesa ${mesa.numero}\nTotal: R$ ${calcularTotal().toFixed(2)}`;

      alert(mensagem);
      onVoltar();

    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      alert('❌ Erro ao enviar pedido! Tente novamente.');
    }

    setEnviando(false);
  };

  if (loading) {
    return (
      <div className="pedido-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Carregando cardápio...
        </div>
      </div>
    );
  }

  return (
    <div className="pedido-container">
      <div className="pedido-header">
        <h2 className="pedido-title">🍽️ Mesa {mesa.numero}</h2>
        <button onClick={onVoltar} className="btn-voltar">
          ← Voltar
        </button>
      </div>

      {/* Entradas */}
      {cardapio.entradas.length > 0 && (
        <div className="cardapio-section">
          <h3 className="categoria-title">🥗 Entradas</h3>
          <div className="cardapio-list">
            {cardapio.entradas.map((item) => (
              <div key={item.id} className="cardapio-item">
                <div className="item-info">
                  <div className="item-nome">{item.nome}</div>
                  {item.descricao && (
                    <div style={{ fontSize: '12px', color: '#999' }}>{item.descricao}</div>
                  )}
                  <div className="item-preco">R$ {parseFloat(item.preco).toFixed(2)}</div>
                </div>
                <button onClick={() => adicionarItem(item)} className="btn-add">
                  + Adicionar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pratos */}
      {cardapio.pratos.length > 0 && (
        <div className="cardapio-section">
          <h3 className="categoria-title">🍖 Pratos Principais</h3>
          <div className="cardapio-list">
            {cardapio.pratos.map((item) => (
              <div key={item.id} className="cardapio-item">
                <div className="item-info">
                  <div className="item-nome">{item.nome}</div>
                  {item.descricao && (
                    <div style={{ fontSize: '12px', color: '#999' }}>{item.descricao}</div>
                  )}
                  <div className="item-preco">R$ {parseFloat(item.preco).toFixed(2)}</div>
                </div>
                <button onClick={() => adicionarItem(item)} className="btn-add">
                  + Adicionar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bebidas */}
      {cardapio.bebidas.length > 0 && (
        <div className="cardapio-section">
          <h3 className="categoria-title">🥤 Bebidas</h3>
          <div className="cardapio-list">
            {cardapio.bebidas.map((item) => (
              <div key={item.id} className="cardapio-item">
                <div className="item-info">
                  <div className="item-nome">{item.nome}</div>
                  {item.descricao && (
                    <div style={{ fontSize: '12px', color: '#999' }}>{item.descricao}</div>
                  )}
                  <div className="item-preco">R$ {parseFloat(item.preco).toFixed(2)}</div>
                </div>
                <button onClick={() => adicionarItem(item)} className="btn-add">
                  + Adicionar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sobremesas */}
      {cardapio.sobremesas.length > 0 && (
        <div className="cardapio-section">
          <h3 className="categoria-title">🍰 Sobremesas</h3>
          <div className="cardapio-list">
            {cardapio.sobremesas.map((item) => (
              <div key={item.id} className="cardapio-item">
                <div className="item-info">
                  <div className="item-nome">{item.nome}</div>
                  {item.descricao && (
                    <div style={{ fontSize: '12px', color: '#999' }}>{item.descricao}</div>
                  )}
                  <div className="item-preco">R$ {parseFloat(item.preco).toFixed(2)}</div>
                </div>
                <button onClick={() => adicionarItem(item)} className="btn-add">
                  + Adicionar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Carrinho */}
      <div className="carrinho-section">
        <h3 className="carrinho-title">🛒 Carrinho ({carrinho.length} itens)</h3>
        
        {carrinho.length === 0 ? (
          <div className="carrinho-empty">
            Nenhum item adicionado ainda
          </div>
        ) : (
          <>
            {carrinho.map((item, index) => (
              <div key={index} className="carrinho-item">
                <div className="carrinho-item-info">
                  <div className="carrinho-item-nome">{item.nome}</div>
                  <div className="carrinho-item-preco">R$ {parseFloat(item.preco).toFixed(2)}</div>
                </div>
                <button onClick={() => removerItem(index)} className="btn-remove">
                  ✕
                </button>
              </div>
            ))}

            <div className="carrinho-total">
              <span>TOTAL:</span>
              <span>R$ {calcularTotal().toFixed(2)}</span>
            </div>

            {/* Campo de Observações */}
            <div className="form-group" style={{ marginTop: '15px' }}>
              <label htmlFor="obs">📝 Observações do Pedido (opcional)</label>
              <textarea
                id="obs"
                placeholder="Ex: Cliente alérgico a amendoim, sem cebola..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '2px solid #e0e0e0',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <button 
              onClick={enviarPedido} 
              className="btn-primary btn-enviar"
              disabled={enviando}
            >
              {enviando ? '⏳ Enviando...' : '🚀 Enviar Pedido para Cozinha'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default NovoPedido;