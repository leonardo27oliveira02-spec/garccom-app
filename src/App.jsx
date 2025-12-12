import { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import MesasList from './components/MesasList';
import NovoPedido from './components/NovoPedido';
import StatusPedidos from './components/StatusPedidos';
import PainelCozinha from './components/PainelCozinha';
import GerenciarCardapio from './components/GerenciarCardapio';
import FecharMesa from './components/FecharMesa';
import CadastrarFuncionario from './components/CadastrarFuncionario';
import PainelAdmin from './components/PainelAdmin';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [userData, setUserData] = useState(null);
  const [selectedMesa, setSelectedMesa] = useState(null);

  // CARREGAR SESSÃO AO INICIAR
  useEffect(() => {
    const sessao = localStorage.getItem('garccom_sessao');
    if (sessao) {
      try {
        const user = JSON.parse(sessao);
        setUserData(user);
        
        if (user.tipo === 'cozinha') {
          setCurrentPage('cozinha');
        } else {
          setCurrentPage('mesas');
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
        localStorage.removeItem('garccom_sessao');
      }
    }
  }, []);

  const handleLogin = (user) => {
    setUserData(user);
    
    // SALVAR SESSÃO
    localStorage.setItem('garccom_sessao', JSON.stringify(user));
    
    if (user.tipo === 'cozinha') {
      setCurrentPage('cozinha');
    } else {
      setCurrentPage('mesas');
    }
  };

  const handleLogout = () => {
    // LIMPAR SESSÃO
    localStorage.removeItem('garccom_sessao');
    
    setUserData(null);
    setCurrentPage('login');
    setSelectedMesa(null);
  };

  const handleSelectMesa = (mesa) => {
    setSelectedMesa(mesa);
    setCurrentPage('novo-pedido');
  };

  const handleVoltar = () => {
    if (currentPage === 'novo-pedido' || currentPage === 'fechar-mesa') {
      setCurrentPage('mesas');
      setSelectedMesa(null);
    } else {
      setCurrentPage('mesas');
    }
  };

  const handleFecharMesa = (mesa) => {
    setSelectedMesa(mesa);
    setCurrentPage('fechar-mesa');
  };

  return (
    <div className="app">
      {currentPage === 'login' && (
        <Login onLogin={handleLogin} />
      )}

      {currentPage === 'mesas' && (
        <MesasList 
          userData={userData}
          onSelectMesa={handleSelectMesa}
          onVerStatus={() => setCurrentPage('status-pedidos')}
          onAdmin={() => setCurrentPage('admin-cardapio')}
          onFecharMesa={handleFecharMesa}
          onGerenciarEquipe={() => setCurrentPage('cadastrar-funcionario')}
          onDashboard={() => setCurrentPage('admin-dashboard')}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'novo-pedido' && (
        <NovoPedido 
          mesa={selectedMesa}
          userData={userData}
          onVoltar={handleVoltar}
        />
      )}

      {currentPage === 'status-pedidos' && (
        <StatusPedidos 
          userData={userData}
          onVoltar={handleVoltar}
        />
      )}

      {currentPage === 'cozinha' && (
        <PainelCozinha 
          userData={userData}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'admin-cardapio' && (
        <GerenciarCardapio 
          userData={userData}
          onVoltar={handleVoltar}
        />
      )}

      {currentPage === 'fechar-mesa' && (
        <FecharMesa 
          mesa={selectedMesa}
          userData={userData}
          onVoltar={handleVoltar}
        />
      )}

      {currentPage === 'cadastrar-funcionario' && (
        <CadastrarFuncionario 
          userData={userData}
          onVoltar={handleVoltar}
        />
      )}

      {currentPage === 'admin-dashboard' && (
        <PainelAdmin 
          userData={userData}
          onVoltar={handleVoltar}
        />
      )}
    </div>
  );
}

export default App;