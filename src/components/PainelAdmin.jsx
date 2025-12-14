import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../services/supabase';
import CadastrarFuncionario from './CadastrarFuncionario';
import GerenciarCardapio from './GerenciarCardapio';

function PainelAdmin({ userData, onVoltar }) {
  const [loading, setLoading] = useState(false);
  const [mostrarCadastro, setMostrarCadastro] = useState(false);
  const [mostrarCardapio, setMostrarCardapio] = useState(false);
  const [metricas, setMetricas] = useState({
    faturamento: 0,
    totalPedidos: 0,
    ticketMedio: 0
  });
  const navigate = useNavigate();

  const carregarMetricas = async () => {
    try {
      setLoading(true);
      
      // Buscar pedidos finalizados
      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('total')
        .eq('status', 'finalizado');

      if (error) throw error;

      if (pedidos && pedidos.length > 0) {
        const faturamento = pedidos.reduce((sum, p) => sum + (p.total || 0), 0);
        const totalPedidos = pedidos.length;
        const ticketMedio = faturamento / totalPedidos;

        setMetricas({
          faturamento: faturamento.toFixed(2),
          totalPedidos,
          ticketMedio: ticketMedio.toFixed(2)
        });
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMetricas();
  }, []);

  if (mostrarCadastro) {
    return (
      <CadastrarFuncionario 
        onVoltar={() => setMostrarCadastro(false)} 
      />
    );
  }

  if (mostrarCardapio) {
    return (
      <GerenciarCardapio 
        onVoltar={() => setMostrarCardapio(false)} 
      />
    );
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a2e'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h2>⏳ Carregando dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: '#1a1a2e', 
      minHeight: '100vh',
      paddingTop: '0',
      paddingBottom: '20px'
    }}>
      {/* HEADER FIXO */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '20px',
        background: '#16213e',
        padding: '20px',
        position: 'sticky',
        top: '0',
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            marginBottom: '5px', 
            color: '#fff',
            margin: '0'
          }}>
            Dashboard Admin 👑
          </h1>
          <p style={{ color: '#999', margin: '5px 0 0 0' }}>
            Bem-vindo, {userData.nome}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setMostrarCardapio(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            🍽️ Gerenciar Cardápio
          </button>

          <button 
            onClick={() => setMostrarCadastro(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            👤 Cadastrar Funcionário
          </button>

          <button 
            onClick={onVoltar} 
            style={{
              padding: '10px 20px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            🚪 Sair
          </button>
        </div>
      </div>

      {/* CONTEÚDO COM PADDING ADEQUADO */}
      <div style={{ padding: '0 20px' }}>
        {/* CARDS DE MÉTRICAS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {/* Card Faturamento Total */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>💰</span>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
                Faturamento Total
              </span>
            </div>
            <h2 style={{ 
              fontSize: '36px', 
              fontWeight: 'bold', 
              color: 'white',
              margin: '0'
            }}>
              R$ {metricas.faturamento}
            </h2>
          </div>

          {/* Card Total de Pedidos */}
          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>📋</span>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
                Total de Pedidos
              </span>
            </div>
            <h2 style={{ 
              fontSize: '36px', 
              fontWeight: 'bold', 
              color: 'white',
              margin: '0'
            }}>
              {metricas.totalPedidos}
            </h2>
          </div>

          {/* Card Ticket Médio */}
          <div style={{
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>🎫</span>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
                Ticket Médio
              </span>
            </div>
            <h2 style={{ 
              fontSize: '36px', 
              fontWeight: 'bold', 
              color: 'white',
              margin: '0'
            }}>
              R$ {metricas.ticketMedio}
            </h2>
          </div>
        </div>

        {/* SEÇÕES DE GESTÃO */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {/* Ranking de Garçons */}
          <div style={{
            background: '#16213e',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ 
              color: 'white', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              👑 Ranking de Garçons
            </h3>
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              Nenhum dado disponível ainda
            </p>
          </div>

          {/* Mais Vendidos */}
          <div style={{
            background: '#16213e',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ 
              color: 'white', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🔥 Mais Vendidos
            </h3>
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              Nenhum dado disponível ainda
            </p>
          </div>

          {/* Horários de Pico */}
          <div style={{
            background: '#16213e',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ 
              color: 'white', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              ⏰ Horários de Pico
            </h3>
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              Nenhum dado disponível ainda
            </p>
          </div>
        </div>

        {/* AÇÕES RÁPIDAS */}
        <div style={{
          marginTop: '30px',
          background: '#16213e',
          borderRadius: '15px',
          padding: '25px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          <h3 style={{ 
            color: 'white', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            ⚡ Ações Rápidas
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            <button
              onClick={() => setMostrarCardapio(true)}
              style={{
                padding: '15px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              📝 Editar Cardápio
            </button>
            
            <button
              onClick={() => setMostrarCadastro(true)}
              style={{
                padding: '15px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              ➕ Novo Funcionário
            </button>

            <button
              onClick={carregarMetricas}
              style={{
                padding: '15px',
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              🔄 Atualizar Dados
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PainelAdmin;
