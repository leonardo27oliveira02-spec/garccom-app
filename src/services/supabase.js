import { createClient } from '@supabase/supabase-js';

// IMPORTANTE: Você vai substituir essas URLs depois
// Vamos pegar do dashboard do Supabase
const supabaseUrl = 'https://xryjaakkzzoezmwhsxkp.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_P4HPXDDvrIalmvqICi7kVg_9CzwWX-1'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função para criar pedido
export const criarPedido = async (pedidoData) => {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .insert([pedidoData])
      .select();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return { success: false, error };
  }
};

// Função para buscar pedidos em tempo real
export const buscarPedidos = async (restauranteId) => {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        mesa:mesas(*),
        garcom:usuarios(*),
        itens:itens_pedido(*)
      `)
      .eq('restaurante_id', restauranteId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return { success: false, error };
  }
};

// Função para atualizar status do pedido
export const atualizarStatusPedido = async (pedidoId, novoStatus) => {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .update({ status: novoStatus, updated_at: new Date() })
      .eq('id', pedidoId)
      .select();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return { success: false, error };
  }
};

// Função para autenticar garçom com PIN
export const autenticarGarcom = async (nome, pin) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('nome', nome)
      .eq('pin', pin)
      .eq('tipo', 'garcom')
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao autenticar:', error);
    return { success: false, error };
  }
};

// Função para buscar mesas
export const buscarMesas = async (restauranteId) => {
  try {
    const { data, error } = await supabase
      .from('mesas')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .order('numero', { ascending: true });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao buscar mesas:', error);
    return { success: false, error };
  }
};

// Função para buscar cardápio
export const buscarCardapio = async (restauranteId) => {
  try {
    const { data, error } = await supabase
      .from('cardapio')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .eq('disponivel', true)
      .order('categoria', { ascending: true });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao buscar cardápio:', error);
    return { success: false, error };
  }
};

// Subscrição para pedidos em tempo real
export const subscribeToOrders = (restauranteId, callback) => {
  const subscription = supabase
    .channel('pedidos-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pedidos',
        filter: `restaurante_id=eq.${restauranteId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
};

// Função para desinscrever
export const unsubscribeFromOrders = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
};