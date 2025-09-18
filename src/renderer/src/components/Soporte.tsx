import React, { useState, useEffect, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import axios from 'axios';
import styled from 'styled-components';

interface Node {
  id: number;
  parent_id: number | null;
  title: string;
  description: string;
  problem: boolean;
  solution: boolean;
  position_x: number;
  position_y: number;
  color: string;
}

interface Connection {
  id: number;
  source_node_id: number;
  target_node_id: number;
  connection_type: string;
}


const MindMapContainer = styled.div`
  width: 100%;
  height: 100vh;
  background-color: #ffffff;
  position: relative;
  overflow: hidden;
  border: 1px solid #ccc; /* Temporal para debug */
`;

const NodeContainer = styled(animated.div)<{ $isProblem: boolean; $isSolution: boolean; $color: string }>`
  position: absolute;
  min-width: 200px;
  max-width: 300px;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background-color: ${props => props.$color};
  color: ${props => (props.$color === '#000000' ? '#ffffff' : props.$color === '#ffffff' ? '#000000' : '#ffffff')};
  cursor: move;
  border: ${props => props.$isProblem ? '2px solid #EF4444' : props.$isSolution ? '2px solid #10B981' : 'none'};
  transition: box-shadow 0.2s ease;
  
  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    z-index: 10;
  }
`;

const NodeTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
`;

const NodeDescription = styled.p`
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
`;

const NodeActions = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
`;

const Button = styled.button`
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.2);
  color: inherit;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }
`;

const ConnectionLine = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
`;

const AddNodeForm = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #ffffff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  width: 300px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  min-height: 60px;
`;

const ColorPicker = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;

const ColorOption = styled.div<{ $color: string }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${props => props.$color};
  cursor: pointer;
  border: ${props => props.$color === '#ffffff' ? '1px solid #E5E7EB' : 'none'};
  
  &:hover {
    transform: scale(1.1);
  }
`;

export const MindMap: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [isLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNode, setNewNode] = useState({
    title: '',
    description: '',
    problem: false,
    solution: false,
    color: '#1E3A8A'
  });
  
  const svgRef = useRef<SVGSVGElement>(null);
  
  console.log('Componente MindMap montado');
console.log('Nodes:', nodes);
console.log('Connections:', connections);
  const colors = [
    '#1E3A8A', // Azul oscuro
    '#3B82F6', // Azul
    '#2563EB', // Azul medio
    '#FFFFFF', // Blanco
    '#000000', // Negro
    '#1E40AF'  // Azul más oscuro
  ];

useEffect(() => {
  const fetchData = async () => {
    try {
      console.log("Iniciando carga de datos...");
      const [nodesRes, connectionsRes] = await Promise.all([
        axios.get('/api/mindmap/nodes'),
        axios.get('/api/mindmap/connections')
      ]);

      console.log("Respuesta de nodos:", nodesRes.data);
      console.log("Respuesta de conexiones:", connectionsRes.data);

      // Verificación explícita de los datos
      if (!Array.isArray(nodesRes.data)) {
        throw new Error('Los nodos no son un array');
      }
      
      if (!Array.isArray(connectionsRes.data)) {
        throw new Error('Las conexiones no son un array');
      }

      setNodes(nodesRes.data);
      setConnections(connectionsRes.data);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  fetchData();
}, []);

  const handleNodeDrag = (id: number, xy: [number, number]) => {
    const [x, y] = xy;
    
    axios.put(`/api/mindmap/nodes/${id}`, {
      ...nodes.find(n => n.id === id),
      position_x: x,
      position_y: y
    }).catch(err => {
      console.error('Error updating node position:', err);
    });
    
    setNodes(nodes.map(node => 
      node.id === id ? { ...node, position_x: x, position_y: y } : node
    ));
  };

const handleAddNode = async () => {
  if (!newNode.title.trim()) return;
  
  try {
    const parentId = selectedNode;
    const res = await axios.post('/api/mindmap/nodes', {
      ...newNode,
      parent_id: parentId,
      position_x: parentId 
        ? (nodes.find(n => n.id === parentId)?.position_x || 0) + 200  // Paréntesis cerrado aquí
        : window.innerWidth / 2,
      position_y: parentId 
        ? (nodes.find(n => n.id === parentId)?.position_y || 0) + 100  // Paréntesis cerrado aquí
        : window.innerHeight / 2
    });
    
    const createdNode = res.data;
    setNodes([...nodes, createdNode]);
    
    if (parentId) {
      const connectionRes = await axios.post('/api/mindmap/connections', {
        source_node_id: parentId,
        target_node_id: createdNode.id,
        connection_type: 'child'
      });
      setConnections([...connections, connectionRes.data]);
    }
    
    setNewNode({
      title: '',
      description: '',
      problem: false,
      solution: false,
      color: '#1E3A8A'
    });
  } catch (err) {
    console.error('Error adding node:', err);
    setError('Error al agregar nodo');
  }
};

  const handleDeleteNode = async (id: number) => {
    try {
      await axios.delete(`/api/mindmap/nodes/${id}`);
      setNodes(nodes.filter(node => node.id !== id));
      setConnections(connections.filter(conn => 
        conn.source_node_id !== id && conn.target_node_id !== id
      ));
    } catch (err) {
      console.error('Error deleting node:', err);
      setError('Error al eliminar nodo');
    }
  };

const calculatePath = (source: Node, target: Node) => {
  const startX = source.position_x + 100;
  const startY = source.position_y + 40;
  const endX = target.position_x + 100;
  const endY = target.position_y + 40;
  
  // Punto de control para la curva Bézier (ahora sí usado)
  const cX1 = startX + (endX - startX) * 0.3;
  const cY1 = startY;
  const cX2 = endX - (endX - startX) * 0.3;
  const cY2 = endY;
  
  return `M${startX},${startY} C${cX1},${cY1} ${cX2},${cY2} ${endX},${endY}`;
};
const [loading, setLoading] = useState(true);
setLoading(true);
try {
  // ... tu código de carga
} finally {
  setLoading(false);
}

// En tu render:
if (loading) {
  return <div>Cargando mapa mental...</div>;
}

if (error) {
  return <div>Error: {error}</div>;
}

if (!Array.isArray(nodes) || !Array.isArray(connections)) {
  return <div>Error: Datos no válidos</div>;
}

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>{error}</div>;

  return (
    <MindMapContainer>
    {loading && (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 100
      }}>
        <p>Cargando mapa mental...</p>
      </div>
    )}
<ConnectionLine ref={svgRef}>
  {Array.isArray(connections) && connections.map(conn => {
    const source = nodes.find(n => n.id === conn.source_node_id);
    const target = nodes.find(n => n.id === conn.target_node_id);
    
    if (!source || !target) return null;
    
    const path = calculatePath(source, target);
    
    return (
      <path
        key={conn.id}
        d={path}
        fill="none"
        stroke="#94A3B8"
        strokeWidth="2"
        strokeDasharray={conn.connection_type === 'child' ? 'none' : '5,5'}
      />
    );
  })}
</ConnectionLine>
      {Array.isArray(nodes) && nodes.map(node => (
      <DraggableNode
        key={node.id}
        node={node}
        onDrag={handleNodeDrag}
        onClick={() => setSelectedNode(node.id)}
        onDelete={handleDeleteNode}
      />
    ))}
      {nodes.map(node => (
        <DraggableNode
          key={node.id}
          node={node}
          onDrag={handleNodeDrag}
          onClick={() => setSelectedNode(node.id)}
          onDelete={handleDeleteNode}
        />
      ))}
      
      <AddNodeForm>
        <h3>Agregar Nuevo Nodo</h3>
        <Input
          type="text"
          placeholder="Título"
          value={newNode.title}
          onChange={(e) => setNewNode({...newNode, title: e.target.value})}
        />
        <TextArea
          placeholder="Descripción"
          value={newNode.description}
          onChange={(e) => setNewNode({...newNode, description: e.target.value})}
        />
        <div>
          <label>
            <input
              type="checkbox"
              checked={newNode.problem}
              onChange={(e) => setNewNode({...newNode, problem: e.target.checked})}
            />
            Es un problema
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={newNode.solution}
              onChange={(e) => setNewNode({...newNode, solution: e.target.checked})}
            />
            Es una solución
          </label>
        </div>
        <ColorPicker>
          {colors.map(color => (
            <ColorOption
              key={color}
              $color={color}
              onClick={() => setNewNode({...newNode, color})}
            />
          ))}
        </ColorPicker>
        <Button onClick={handleAddNode}>
          Agregar {selectedNode ? 'Subnodo' : 'Nodo Raíz'}
        </Button>
        {selectedNode && (
          <Button onClick={() => setSelectedNode(null)}>
            Cancelar Selección
          </Button>
        )}
      </AddNodeForm>
    </MindMapContainer>
  );
};

interface DraggableNodeProps {
  node: Node;
  onDrag: (id: number, xy: [number, number]) => void;
  onClick: () => void;
  onDelete: (id: number) => void;
}

const DraggableNode: React.FC<DraggableNodeProps> = ({ node, onDrag, onClick, onDelete }) => {
  const [{ x, y }, api] = useSpring(() => ({
    x: node.position_x,
    y: node.position_y,
  }));
  
  const bind = useDrag(({ down, movement: [mx, my] }) => {
    const newX = node.position_x + mx;
    const newY = node.position_y + my;
    api.start({ x: down ? newX : node.position_x, y: down ? newY : node.position_y });
    
    if (!down) {
      onDrag(node.id, [newX, newY]);
    }
  });
  
  return (
    <NodeContainer
      {...bind()}
      style={{ x, y }}
      $isProblem={node.problem}
      $isSolution={node.solution}
      $color={node.color}
      onClick={onClick}
    >
      <NodeTitle>{node.title}</NodeTitle>
      <NodeDescription>{node.description}</NodeDescription>
      <NodeActions>
        <Button onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}>
          Eliminar
        </Button>
        <Button onClick={(e) => e.stopPropagation()}>
          Editar
        </Button>
      </NodeActions>
    </NodeContainer>
  );
};
