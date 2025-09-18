import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';
import { FiUser, FiLock, FiArrowRight } from 'react-icons/fi';

// Animaciones
const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const pulseAnimation = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(0, 180, 216, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(0, 180, 216, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 180, 216, 0); }
`;

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(-45deg, #0f3460, #1a1a2e, #16213e, #0f3460);
  background-size: 400% 400%;
  animation: ${gradientFlow} 12s ease infinite;
  font-family: 'Segoe UI', 'Roboto', sans-serif;
`;

const LoginForm = styled.div`
  background: rgba(15, 52, 96, 0.85);
  backdrop-filter: blur(10px);
  padding: 2.5rem 3rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 
              0 0 20px rgba(0, 180, 216, 0.2) inset;
  width: 380px;
  transition: all 0.4s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  
  &:before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      to bottom right,
      rgba(0, 180, 216, 0.1) 0%,
      transparent 50%,
      rgba(0, 180, 216, 0.1) 100%
    );
    transform: rotate(30deg);
    animation: ${floatAnimation} 8s ease-in-out infinite;
    z-index: -1;
  }
`;

const Title = styled.h2`
  color: #fff;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: 600;
  letter-spacing: 1px;
  position: relative;
  text-transform: uppercase;
  
  &:after {
    content: '';
    display: block;
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, #00b4d8, #0096c7);
    margin: 0.5rem auto 0;
    border-radius: 3px;
  }
`;

const InputGroup = styled.div`
  margin-bottom: 1.8rem;
  position: relative;
`;

const Label = styled.label`
  display: block;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.9rem 1rem 0.9rem 2.8rem;
  border: 1px solid rgba(45, 64, 89, 0.5);
  border-radius: 8px;
  background: rgba(26, 26, 46, 0.6);
  color: #fff;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  
  &:focus {
    outline: none;
    border-color: #00b4d8;
    box-shadow: 0 0 0 2px rgba(0, 180, 216, 0.3);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const InputIcon = styled.span`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.1rem;
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #00b4d8, #0096c7);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: linear-gradient(135deg, #0096c7, #0077b6);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 180, 216, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #555;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  &:after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: rgba(255, 255, 255, 0.1);
    transform: rotate(45deg);
    transition: all 0.3s ease;
  }
  
  &:hover:after {
    left: 100%;
  }
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  margin-top: 1.2rem;
  text-align: center;
  font-size: 0.9rem;
  padding: 0.8rem;
  background: rgba(233, 69, 96, 0.1);
  border-radius: 6px;
  border-left: 3px solid #e94560;
  animation: ${pulseAnimation} 2s infinite;
`;

const ButtonIcon = styled.span`
  margin-left: 0.5rem;
  display: flex;
  align-items: center;
  transition: transform 0.3s ease;
  
  ${Button}:hover & {
    transform: translateX(3px);
  }
`;

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Efecto de carga inicial
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:3003/api/login', {
        username,
        password
      });

      if (response.data) {
        // Guardar datos de usuario si es necesario
        localStorage.setItem('userData', JSON.stringify(response.data.user));
      navigate('/supermenu');
      }
    } catch (err) {
      setError('Credenciales incorrectas o error de conexión');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginForm>
        <Title>Acceso Seguro</Title>
        <form onSubmit={handleSubmit}>
          <InputGroup>
            <Label>Usuario</Label>
            <InputIcon><FiUser /></InputIcon>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingrese su usuario"
              required
            />
          </InputGroup>
          <InputGroup>
            <Label>Contraseña</Label>
            <InputIcon><FiLock /></InputIcon>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </InputGroup>
          <Button type="submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Ingresar'}
            {!loading && <ButtonIcon><FiArrowRight /></ButtonIcon>}
          </Button>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </form>
      </LoginForm>
    </LoginContainer>
  );
};

export default Login;