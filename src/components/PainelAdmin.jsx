import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

function PainelAdmin({ userData, onVoltar }) {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('hoje'); // hoje, semana, mes
  const [metricas, setMetricas] = useState({
    vendas: { total: 0, pedidos: 0, ticketMedio: 0 },
    maisVendidos: [],
    rankingGarcons: [],
    horariosPico: [],
    categorias: {},
    comparativo: { vendas: 0, pedidos: 0 }
  });

  useEffect(() => {
    carregarMetricas();
  }, [periodo, userData]);

  const getDataInicio = () => {
    const agora = new Date();
    const inicio = new Date();
    
    if (periodo === 'hoje') {
      inicio.setHours(0, 0, 0, 0);
    } else if (periodo === 'semana') {
      inicio.setDate(agora.getDate() - 7);
      inicio.setHours(0, 0, 0, 0);
    } else if (periodo === 'mes') {
      inicio.setDate(agora.getDate() - 30);
      inicio.setHours(0, 0, 0, 0);
    }
    
    return inicio.toISOString();
  };

  const carregarMetricas = async () => {
    setLoading(true);
    const dataInicio = getDataInicio();

    try {
      // 1. VENDAS TOTAIS
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('total, created_at')
        .eq('restaurante_id', userData.restaurante_id)
        .neq('status', 'cancelado')
        .gte('created_at', dataInicio);

      const totalVendas = pedidos?.reduce((sum, p) => sum + parseFloat(p.total), 0) || 0;
      const numPedidos = pedidos?.length || 0;
      const ticketMedio = numPedidos > 0 ? totalVendas / numPedidos : 0;

      // 2. PRODUTOS MAIS VENDIDOS
      const { data: itensMaisVendidos } = await supabase
        .from('itens_pedido')
        .select('nome_item, quantidade, preco_unitario, pedido_id')
        .gte('created_at', dataInicio);

      const agrupados = {};
      itensMaisVendidos?.forEach(item => {
        if (!agrupados[item.nome_item]) {
          agrupados[item.nome_item] = { nome: item.nome_item, quantidade: 0, total: 0 };
        }
        agrupados[item.nome_item].quantidade += item.quantidade;
        agrupados[item.nome_item].total += item.quantidade * parseFloat(item.preco_unitario);
      });

      const maisVendidos = Object.values(agrupados)
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 10);

      // 3. RANKING DE GARÇONS
      const { data: pedidosGarcons } = await supabase
        .from('pedidos')
        .select('total, garcom:usuarios(nome)')
        .eq('restaurante_id', userData.restaurante_id)
        .neq('status', 'cancelado')
        .gte('created_at', dataInicio);

      const garcons = {};
      pedidosGarcons?.forEach(p => {
        const nome = p.garcom?.nome || 'Sem garçom';
        if (!garcons[nome]) {
          garcons[nome] = { nome, vendas: 0, pedidos: 0 };
        }
        garcons[nome].vendas += parseFloat(p.total);
        garcons[nome].pedidos += 1;
      });

      const rankingGarcons = Object.values(garcons)
        .sort((a, b) => b.vendas - a.vendas);

      // 4. HORÁRIOS DE PICO
      const horarios = {};
      pedidos?.forEach(p => {
        const hora = new Date(p.created_at).getHours();
        if (!horarios[hora]) horarios[hora] = 0;
        horarios[hora] += 1;
      });

      const horariosPico = Object.entries(horarios)
        .map(([hora, qtd]) => ({ hora: `${hora}h`, quantidade: qtd }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);

      // 5. VENDAS POR CATEGORIA
      const { data: itensCategoria } = await supabase
        .from('itens_pedido')
        .select('nome_item, quantidade, preco_unitario, pedido_id')
        .gte('created_at', dataInicio);

      const { data: cardapio } = await supabase
        .from('cardapio')
        .select('nome, categoria')
        .eq('restaurante_id', userData.restaurante_id);

      const categorias = {};
      itensCategoria?.forEach(item => {
        const itemCard = cardapio?.find(c => c.nome === item.nome_item);
        const cat = itemCard?.categoria || 'Outros';
        if (!categorias[cat]) categorias[cat] = 0;
        categorias[cat] += item.quantidade * parseFloat(item.preco_unitario);
      });

      setMetricas({
        vendas: { total: totalVendas, pedidos: numPedidos, ticketMedio },
        maisVendidos,
        rankingGarcons,
        horariosPico,
        categorias
      });

    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'white' }}>
        Carregando dashboard...
      </div>
    );
  }

  const catLabels = {
    'entradas': '🥗 Entradas',
    'pratos': '🍔 Lanches',
    'bebidas': '🥤 Bebidas',
    'sobremesas': '🍰 Sobremesas'
  };

  return (
    <div style={{ background: '#1a1a1a', minHeight: '100vh', padding: '20px', color: 'white' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>📊 Dashboard Admin</h1>
            <p style={{ color: '#999' }}>Bem-vindo, {userData.nome}</p>
          </div>
          <button onClick={onVoltar} className="btn-secondary btn-logout">← Voltar</button>
        </div>

        {/* FILTROS */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
          <button 
            onClick={() => setPeriodo('hoje')}
            style={{
              padding: '12px 30px',
              background: periodo === 'hoje' ? '#667eea' : '#2d2d2d',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Hoje
          </button>
          <button 
            onClick={() => setPeriodo('semana')}
            style={{
              padding: '12px 30px',
              background: periodo === 'semana' ? '#667eea' : '#2d2d2d',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            7 Dias
          </button>
          <button 
            onClick={() => setPeriodo('mes')}
            style={{
              padding: '12px 30px',
              background: periodo === 'mes' ? '#667eea' : '#2d2d2d',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            30 Dias
          </button>
        </div>

        {/* CARDS DE MÉTRICAS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '30px', borderRadius: '20px' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '10px' }}>💰 Faturamento Total</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>R$ {metricas.vendas.total.toFixed(2)}</div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', padding: '30px', borderRadius: '20px' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '10px' }}>🍽️ Total de Pedidos</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{metricas.vendas.pedidos}</div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #ffd89b 0%, #ff6348 100%)', padding: '30px', borderRadius: '20px' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '10px', color: '#333' }}>📈 Ticket Médio</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#333' }}>R$ {metricas.vendas.ticketMedio.toFixed(2)}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          {/* RANKING GARÇONS */}
          <div style={{ background: '#2d2d2d', padding: '30px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>👑 Ranking de Garçons</h3>
            {metricas.rankingGarcons.map((garcom, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '15px',
                background: index === 0 ? '#667eea' : '#3d3d3d',
                borderRadius: '10px',
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{index + 1}º</div>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{garcom.nome}</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>{garcom.pedidos} pedidos</div>
                  </div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2ecc71' }}>
                  R$ {garcom.vendas.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* PRODUTOS MAIS VENDIDOS */}
          <div style={{ background: '#2d2d2d', padding: '30px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>🔥 Mais Vendidos</h3>
            {metricas.maisVendidos.slice(0, 8).map((item, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid #3d3d3d'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{item.nome}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>{item.quantidade} unidades</div>
                </div>
                <div style={{ fontWeight: 'bold', color: '#ffd89b' }}>
                  R$ {item.total.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* HORÁRIOS DE PICO */}
          <div style={{ background: '#2d2d2d', padding: '30px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>⏰ Horários de Pico</h3>
            {metricas.horariosPico.map((horario, index) => (
              <div key={index} style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontWeight: 'bold' }}>{horario.hora}</span>
                  <span>{horario.quantidade} pedidos</span>
                </div>
                <div style={{ 
                  height: '8px', 
                  background: '#3d3d3d', 
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${(horario.quantidade / metricas.horariosPico[0]?.quantidade) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #667eea 0%, #f093fb 100%)',
                    borderRadius: '10px'
                  }}/>
                </div>
              </div>
            ))}
          </div>

          {/* VENDAS POR CATEGORIA */}
          <div style={{ background: '#2d2d2d', padding: '30px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>📂 Vendas por Categoria</h3>
            {Object.entries(metricas.categorias).map(([cat, valor], index) => {
              const totalCategorias = Object.values(metricas.categorias).reduce((a, b) => a + b, 0);
              const percentual = ((valor / totalCategorias) * 100).toFixed(1);
              
              return (
                <div key={index} style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>{catLabels[cat] || cat}</span>
                    <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>R$ {valor.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      flex: 1,
                      height: '12px', 
                      background: '#3d3d3d', 
                      borderRadius: '10px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${percentual}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #2ecc71 0%, #27ae60 100%)',
                        borderRadius: '10px'
                      }}/>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', minWidth: '50px', textAlign: 'right' }}>
                      {percentual}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PainelAdmin;