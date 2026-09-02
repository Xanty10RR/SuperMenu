import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import SuperMenu from './components/SuperMenu';
import ChatBotDashboard from './components/ChatBotDashboard';
//import ProtectedRoute from './components/ProtectedRoute';


const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/supermenu" 
          element={
            
              <SuperMenu />
            
          } 
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/chatbot-metrics" element={<ChatBotDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;