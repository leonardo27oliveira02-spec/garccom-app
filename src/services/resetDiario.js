import { supabase } from './supabase';

export const verificarResetDiario = async (restauranteId) => {
  try {
    // Buscar configuração
    const { data: config } = await supabase
      .from('configuracoes')
      .select('ultimo_reset')
      .eq('restaurante_id', restauranteId)
      .maybeSingle();

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const ultimaData = config?.ultimo_reset 
      ? new Date(config.ultimo_reset) 
      : null;

    // Se não resetou hoje OU nunca resetou, fazer reset
    if (!ultimaData || ultimaData < hoje) {
      await executarReset(restauranteId);
    }
  } catch (error) {
    console.error('Erro ao verificar reset:', error);
  }
};

const executarReset = async (restauranteId) => {
  try {
    console.log('🔄 Executando reset diário...');

    // Arquivar TODOS os pedidos fechados (de qualquer dia)
    const { data: pedidosArquivados } = await supabase
      .from('pedidos')
      .update({ status: 'arquivado' })
      .eq('restaurante_id', restauranteId)
      .eq('status', 'fechado')
      .select();

    console.log(`✅ ${pedidosArquivados?.length || 0} pedidos arquivados`);

    // Atualizar data do reset
    await supabase
      .from('configuracoes')
      .upsert({
        restaurante_id: restauranteId,
        ultimo_reset: new Date().toISOString()
      }, {
        onConflict: 'restaurante_id'
      });

    console.log('✅ Reset diário concluído!');
  } catch (error) {
    console.error('❌ Erro ao executar reset:', error);
  }
};