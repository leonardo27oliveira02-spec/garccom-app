import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

function GerenciarCardapio({ userData, onVoltar }) {
  const [cardapio, setCardapio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [novoItem, setNovoItem] = useState({
    categoria: 'pratos',
    nome: '',
    descricao: '',
    preco: '',
    disponivel: true
  });

  useEffect(() => {
    carregarCardapio();
  }, []);

  const carregarCardapio = async () => {
    const { data, error } = await supabase
      .from('cardapio')
      .select('*')
      .eq('restaurante_id', userData.restaurante_id)
      .order('categoria', { ascending: true })
      .order('nome', { ascending: true });

    if (!error) {
      setCardapio(data || []);
    }
    setLoading(false);
  };

  const adicionarItem = async () => {
    if (!novoItem.nome || !novoItem.preco) {
      alert('Preencha nome e preço!');
      return;
    }

    const { error } = await supabase
      .from('cardapio')
      .insert([{
        ...novoItem,
        restaurante_id: userData.restaurante_id,
        preco: parseFloat(novoItem.preco)
      }]);

    if (!error) {
      alert('✅ Item adicionado!');
      setNovoItem({ categoria: 'pratos', nome: '', descricao: '', preco: '', disponivel: true });
      carregarCardapio();
    } else {
      alert('❌ Erro ao adicionar!');
    }
  };

  const toggleDisponivel = async (item) => {
    const { error } = await supabase
      .from('cardapio')
      .update({ disponivel: !item.disponivel })
      .eq('id', item.id);

    if (!error) {
      carregarCardapio();
    }
  };

  const excluirItem = async (id) => {
    if (!window.confirm('Excluir este item?')) return;

    const { error } = await supabase
      .from('cardapio')
      .delete()
      .eq('id', id);

    if (!error) {
      alert('✅ Item excluído!');
      carregarCardapio();
    }
  };

  const salvarEdicao = async () => {
    const { error } = await supabase
      .from('cardapio')
      .update({
        nome: editando.nome,
        descricao: editando.descricao,
        preco: parseFloat(editando.preco),
        categoria: editando.categoria
      })
      .eq('id', editando.id);

    if (!error) {
      alert('✅ Item atualizado!');
      setEditando(null);
      carregarCardapio();
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'white' }}>Carregando...</div>;
  }

  return (
    <div className="admin-container">
      <div className="pedido-header">
        <h2 className="pedido-title">🍔 Gerenciar Cardápio</h2>
        <button onClick={onVoltar} className="btn-voltar">← Voltar</button>
      </div>

      <div className="admin-form">
        <h3 style={{ marginBottom: '15px' }}>➕ Adicionar Novo Item</h3>
        
        <select 
          value={novoItem.categoria}
          onChange={(e) => setNovoItem({...novoItem, categoria: e.target.value})}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '2px solid #e0e0e0' }}
        >
          <option value="entradas">🥗 Entradas/Porções</option>
          <option value="pratos">🍔 Lanches</option>
          <option value="bebidas">🥤 Bebidas</option>
          <option value="sobremesas">🍰 Sobremesas</option>
        </select>

        <input
          type="text"
          placeholder="Nome do item"
          value={novoItem.nome}
          onChange={(e) => setNovoItem({...novoItem, nome: e.target.value})}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '2px solid #e0e0e0' }}
        />

        <input
          type="text"
          placeholder="Descrição (opcional)"
          value={novoItem.descricao}
          onChange={(e) => setNovoItem({...novoItem, descricao: e.target.value})}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '2px solid #e0e0e0' }}
        />

        <input
          type="number"
          step="0.01"
          placeholder="Preço (ex: 18.50)"
          value={novoItem.preco}
          onChange={(e) => setNovoItem({...novoItem, preco: e.target.value})}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '2px solid #e0e0e0' }}
        />

        <button onClick={adicionarItem} className="btn-primary" style={{ width: '100%' }}>
          ➕ Adicionar Item
        </button>
      </div>

      <div className="admin-list">
        {['entradas', 'pratos', 'bebidas', 'sobremesas'].map(categoria => {
          const itens = cardapio.filter(i => i.categoria === categoria);
          if (itens.length === 0) return null;

          const icons = { entradas: '🥗', pratos: '🍔', bebidas: '🥤', sobremesas: '🍰' };
          const titles = { entradas: 'Entradas/Porções', pratos: 'Lanches', bebidas: 'Bebidas', sobremesas: 'Sobremesas' };

          return (
            <div key={categoria} style={{ marginTop: '30px' }}>
              <h3 className="categoria-title">{icons[categoria]} {titles[categoria]}</h3>
              
              {itens.map(item => (
                editando?.id === item.id ? (
                  <div key={item.id} className="admin-item-edit">
                    <input
                      value={editando.nome}
                      onChange={(e) => setEditando({...editando, nome: e.target.value})}
                      style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '5px', border: '2px solid #667eea' }}
                    />
                    <input
                      value={editando.descricao}
                      onChange={(e) => setEditando({...editando, descricao: e.target.value})}
                      style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '5px', border: '2px solid #667eea' }}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={editando.preco}
                      onChange={(e) => setEditando({...editando, preco: e.target.value})}
                      style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '5px', border: '2px solid #667eea' }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={salvarEdicao} style={{ flex: 1, padding: '8px', background: '#5f27cd', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                        💾 Salvar
                      </button>
                      <button onClick={() => setEditando(null)} style={{ flex: 1, padding: '8px', background: '#999', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        ✕ Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={item.id} className="admin-item">
                    <div className="admin-item-info">
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{item.nome}</div>
                      {item.descricao && <div style={{ fontSize: '12px', color: '#666' }}>{item.descricao}</div>}
                      <div style={{ color: '#ff6b6b', fontWeight: 'bold' }}>R$ {parseFloat(item.preco).toFixed(2)}</div>
                    </div>
                    <div className="admin-item-actions">
                      <button 
                        onClick={() => toggleDisponivel(item)}
                        style={{ 
                          padding: '8px 15px', 
                          background: item.disponivel ? '#2ecc71' : '#999',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        {item.disponivel ? '✅ Ativo' : '🚫 Inativo'}
                      </button>
                      <button 
                        onClick={() => setEditando(item)}
                        style={{ padding: '8px 15px', background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        onClick={() => excluirItem(item.id)}
                        style={{ padding: '8px 15px', background: '#ff4757', color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GerenciarCardapio;