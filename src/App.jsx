import { useState } from 'react';
import './App.css';
import Login from './components/Login';
import MesasList from './components/MesasList';
import NovoPedido from './components/NovoPedido';
import StatusPedidos from './components/StatusPedidos';
import PainelCozinha from './components/PainelCozinha';
import GerenciarCardapio from './components/GerenciarCardapio';
import FecharMesa from './components/FecharMesa';
import CadastrarFuncionario from './components/CadastrarFuncionario';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [userData, setUserData] = useState(null);
  const [selectedMesa, setSelectedMesa] = useState(null);

  const handleLogin = (user) => {
    setUserData(user);
    
    if (user.tipo === 'cozinha') {
      setCurrentPage('cozinha');
    } else {
      setCurrentPage('mesas');
    }
  };

  const handleLogout = () => {
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
    </div>
  );
}

export default App;