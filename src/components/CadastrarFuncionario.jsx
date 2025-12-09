import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

function CadastrarFuncionario({ userData, onVoltar }) {
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [novoFunc, setNovoFunc] = useState({
    nome: '',
    tipo: 'garcom',
    pin: ''
  });

  useEffect(() => {
    carregarFuncionarios();
  }, []);

  const carregarFuncionarios = async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('restaurante_id', userData.restaurante_id)
      .order('nome', { ascending: true });

    if (!error) {
      setFuncionarios(data || []);
    }
    setLoading(false);
  };

  const adicionarFuncionario = async () => {
    if (!novoFunc.nome || !novoFunc.pin) {
      alert('❌ Preencha nome e PIN!');
      return;
    }

    if (novoFunc.pin.length !== 4) {
      alert('❌ O PIN deve ter 4 dígitos!');
      return;
    }

    // Verificar se PIN já existe
    const pinExiste = funcionarios.some(f => f.pin === novoFunc.pin);
    if (pinExiste) {
      alert('❌ Este PIN já está em uso! Escolha outro.');
      return;
    }

    const { error } = await supabase
      .from('usuarios')
      .insert([{
        restaurante_id: userData.restaurante_id,
        nome: novoFunc.nome,
        tipo: novoFunc.tipo,
        pin: novoFunc.pin,
        ativo: true
      }]);

    if (!error) {
      alert('✅ Funcionário cadastrado!');
      setNovoFunc({ nome: '', tipo: 'garcom', pin: '' });
      carregarFuncionarios();
    } else {
      alert('❌ Erro ao cadastrar!');
      console.error(error);
    }
  };

  const toggleAtivo = async (func) => {
    const { error } = await supabase
      .from('usuarios')
      .update({ ativo: !func.ativo })
      .eq('id', func.id);

    if (!error) {
      carregarFuncionarios();
    }
  };

  const excluirFuncionario = async (id) => {
    if (!window.confirm('⚠️ Excluir este funcionário?\n\nIsso não afetará os pedidos já feitos por ele.')) {
      return;
    }

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (!error) {
      alert('✅ Funcionário excluído!');
      carregarFuncionarios();
    } else {
      alert('❌ Erro ao excluir!');
    }
  };

  const resetarPIN = async (func) => {
    const novoPIN = window.prompt(`🔐 Novo PIN para ${func.nome}:\n\n(4 dígitos)`);
    
    if (!novoPIN) return;

    if (novoPIN.length !== 4 || isNaN(novoPIN)) {
      alert('❌ PIN inválido! Deve ter 4 dígitos numéricos.');
      return;
    }

    // Verificar se novo PIN já existe
    const pinExiste = funcionarios.some(f => f.pin === novoPIN && f.id !== func.id);
    if (pinExiste) {
      alert('❌ Este PIN já está em uso!');
      return;
    }

    const { error } = await supabase
      .from('usuarios')
      .update({ pin: novoPIN })
      .eq('id', func.id);

    if (!error) {
      alert(`✅ PIN atualizado!\n\n${func.nome}\nNovo PIN: ${novoPIN}`);
      carregarFuncionarios();
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'white' }}>Carregando...</div>;
  }

  return (
    <div className="admin-container">
      <div className="pedido-header">
        <h2 className="pedido-title">👥 Gerenciar Equipe</h2>
        <button onClick={onVoltar} className="btn-voltar">← Voltar</button>
      </div>

      {/* Formulário Novo Funcionário */}
      <div className="admin-form">
        <h3 style={{ marginBottom: '15px' }}>➕ Adicionar Funcionário</h3>
        
        <input
          type="text"
          placeholder="Nome completo"
          value={novoFunc.nome}
          onChange={(e) => setNovoFunc({...novoFunc, nome: e.target.value})}
          style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '14px' }}
        />

        <select 
          value={novoFunc.tipo}
          onChange={(e) => setNovoFunc({...novoFunc, tipo: e.target.value})}
          style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '14px' }}
        >
          <option value="garcom">🍽️ Garçom</option>
          <option value="cozinha">🍳 Cozinha</option>
          <option value="admin">⚙️ Administrador</option>
        </select>

        <input
          type="text"
          placeholder="PIN (4 dígitos)"
          value={novoFunc.pin}
          maxLength="4"
          onChange={(e) => {
            const valor = e.target.value.replace(/\D/g, '');
            setNovoFunc({...novoFunc, pin: valor});
          }}
          style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '14px', letterSpacing: '5px', textAlign: 'center', fontWeight: 'bold' }}
        />

        <button onClick={adicionarFuncionario} className="btn-primary" style={{ width: '100%' }}>
          ➕ Cadastrar Funcionário
        </button>
      </div>

      {/* Lista de Funcionários */}
      <div className="admin-list">
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '15px', color: '#333' }}>
          📋 Equipe Cadastrada ({funcionarios.length})
        </h3>

        {funcionarios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            Nenhum funcionário cadastrado ainda
          </div>
        ) : (
          funcionarios.map(func => (
            <div key={func.id} className="admin-item" style={{ 
              opacity: func.ativo ? 1 : 0.5,
              border: func.id === userData.id ? '2px solid #667eea' : 'none'
            }}>
              <div className="admin-item-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <span style={{ fontSize: '24px' }}>
                    {func.tipo === 'garcom' ? '🍽️' : func.tipo === 'cozinha' ? '🍳' : '⚙️'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                      {func.nome}
                      {func.id === userData.id && (
                        <span style={{ 
                          marginLeft: '10px', 
                          padding: '2px 8px', 
                          background: '#667eea', 
                          color: 'white', 
                          borderRadius: '10px', 
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          VOCÊ
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {func.tipo === 'garcom' ? 'Garçom' : func.tipo === 'cozinha' ? 'Cozinha' : 'Administrador'}
                      {' • '}
                      PIN: {'•'.repeat(4)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="admin-item-actions">
                <button 
                  onClick={() => toggleAtivo(func)}
                  style={{ 
                    padding: '8px 15px', 
                    background: func.ativo ? '#2ecc71' : '#999',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {func.ativo ? '✅ Ativo' : '🚫 Inativo'}
                </button>
                
                <button 
                  onClick={() => resetarPIN(func)}
                  style={{ 
                    padding: '8px 15px', 
                    background: '#667eea', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '5px', 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer' 
                  }}
                >
                  🔑 Resetar PIN
                </button>
                
                {func.id !== userData.id && (
                  <button 
                    onClick={() => excluirFuncionario(func.id)}
                    style={{ 
                      padding: '8px 15px', 
                      background: '#ff4757', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '5px', 
                      fontSize: '12px', 
                      fontWeight: 'bold', 
                      cursor: 'pointer' 
                    }}
                  >
                    🗑️ Excluir
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dicas */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        background: '#f0f8ff', 
        borderRadius: '15px',
        border: '2px solid #667eea'
      }}>
        <h4 style={{ marginBottom: '10px', color: '#667eea' }}>💡 Dicas:</h4>
        <ul style={{ fontSize: '14px', color: '#666', lineHeight: '1.8' }}>
          <li>Cada funcionário precisa de um <strong>PIN único de 4 dígitos</strong></li>
          <li>Funcionários <strong>inativos</strong> não conseguem fazer login</li>
          <li>Use o botão <strong>"Resetar PIN"</strong> se alguém esquecer a senha</li>
          <li><strong>Administradores</strong> têm acesso completo ao sistema</li>
        </ul>
      </div>
    </div>
  );
}

export default CadastrarFuncionario;