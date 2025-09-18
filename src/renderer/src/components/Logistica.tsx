    import React, { useState, useEffect } from 'react';
    import { faEye, faCheckCircle, faTimesCircle, faClock, faTruck, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
    import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
    import axios from 'axios';
    import '../styles/ApprovalList.css';

    interface ApprovalItem {
    id: number;
    datos_completos: {
        nombre_solicitante: string;
        departamento_origen: string;
        descripcion: string;
        fecha_solicitud: string;
        [key: string]: any;
    };
    estado: string;
    aprobador: string;
    tabla_origen: string;
    fecha_decision: string;
    entregado_por?: string;
    fecha_entrega?: string;
    observaciones?: string;
    }

    type TabType = 'approved' | 'pending' | 'delivered';

    export const ApprovalList: React.FC = () => {
    const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
    const [pending, setPending] = useState<ApprovalItem[]>([]);
    const [delivered, setDelivered] = useState<ApprovalItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('approved');
    const [deliveryData, setDeliveryData] = useState({
        entregado_por: '',
        observaciones: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await axios.get('http://localhost:3003/api/aprobaciones');

            const approvedItems = response.data
            .filter((item: ApprovalItem) => item.estado.toLowerCase() === 'aprobado')
            .sort((a: ApprovalItem, b: ApprovalItem) => 
                new Date(b.fecha_decision).getTime() - new Date(a.fecha_decision).getTime()
            );

            const pendingItems = response.data
            .filter((item: ApprovalItem) => item.estado.toLowerCase() !== 'aprobado' && item.estado.toLowerCase() !== 'entregado')
            .sort((a: ApprovalItem, b: ApprovalItem) => 
                new Date(b.fecha_decision).getTime() - new Date(a.fecha_decision).getTime()
            );

            const deliveredItems = response.data
            .filter((item: ApprovalItem) => item.estado.toLowerCase() === 'entregado')
            .sort((a: ApprovalItem, b: ApprovalItem) => 
                new Date(b.fecha_entrega || b.fecha_decision).getTime() - new Date(a.fecha_entrega || a.fecha_decision).getTime()
            );

            setApprovals(approvedItems);
            setPending(pendingItems);
            setDelivered(deliveredItems);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Error al cargar los datos. Por favor intente nuevamente.');
        } finally {
            setLoading(false);
        }
        };

        fetchData();
    }, []);

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleDelivery = async (aprobacionId: number) => {
        if (!deliveryData.entregado_por.trim()) {
        alert('Por favor ingrese el nombre de quien realiza la entrega');
        return;
        }

        try {
        setIsSubmitting(true);
        setError(null);

        // Actualizar el estado en el backend
            await axios.patch(`http://localhost:3003/api/aprobaciones/${aprobacionId}/entregar`, {
            entregado_por: deliveryData.entregado_por.trim(),
            observaciones: deliveryData.observaciones.trim()
            });

        // Actualizar el estado local
        const updatedItem = approvals.find(item => item.id === aprobacionId);
        if (updatedItem) {
            const deliveredItem = {
            ...updatedItem,
            estado: 'Entregado',
            entregado_por: deliveryData.entregado_por.trim(),
            observaciones: deliveryData.observaciones.trim(),
            fecha_entrega: new Date().toISOString()
            };

            setApprovals(prev => prev.filter(item => item.id !== aprobacionId));
            setDelivered(prev => [deliveredItem, ...prev]);
        }

        // Resetear el formulario
        setDeliveryData({ entregado_por: '', observaciones: '' });
        setExpandedId(null);
        } catch (err) {
        console.error('Error al registrar entrega:', err);
        setError('Error al registrar entrega. Por favor intente nuevamente.');
        } finally {
        setIsSubmitting(false);
        }
    };

    const handleDeliveryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDeliveryData(prev => ({
        ...prev,
        [name]: value
        }));
    };

    const renderStatusIcon = (status: string) => {
        const statusLower = status.toLowerCase();
        if (statusLower === 'aprobado') {
        return <FontAwesomeIcon icon={faCheckCircle} className="status-icon approved" />;
        }
        if (statusLower === 'rechazado') {
        return <FontAwesomeIcon icon={faTimesCircle} className="status-icon rejected" />;
        }
        if (statusLower === 'entregado') {
        return <FontAwesomeIcon icon={faBoxOpen} className="status-icon delivered" />;
        }
        return <FontAwesomeIcon icon={faClock} className="status-icon pending" />;
    };

    const renderTabContent = () => {
        switch (activeTab) {
        case 'approved':
            return renderApprovalList(approvals, true);
        case 'pending':
            return renderApprovalList(pending, false);
        case 'delivered':
            return renderApprovalList(delivered, false, true);
        default:
            return null;
        }
    };

    const renderApprovalList = (items: ApprovalItem[], showDeliveryButton: boolean, isDelivered: boolean = false) => {
        if (items.length === 0) {
        return <div className="no-results">No hay elementos para mostrar</div>;
        }

        return (
        <div className={`approval-list ${isDelivered ? 'delivered-list' : ''}`}>
            {items.map((item) => (
            <div 
                key={item.id} 
                className={`approval-item ${isDelivered ? 'delivered-item' : ''} ${expandedId === item.id ? 'expanded' : ''}`}
            >
                <div className="item-header" onClick={() => toggleExpand(item.id)}>
                <div className="header-info">
                    <h3>{item.datos_completos.nombre_solicitante}</h3>
                    <p className="department">{item.datos_completos.departamento_origen}</p>
                    <p className="description">{item.datos_completos.descripcion}</p>
                </div>
                
                <div className="header-dates">
                    <p className="request-date">
                    <span>Solicitud:</span> {new Date(item.datos_completos.fecha_solicitud).toLocaleDateString()}
                    </p>
                    {isDelivered ? (
                    <p className="delivery-date">
                        <span>Entregado:</span> {new Date(item.fecha_entrega || item.fecha_decision).toLocaleDateString()}
                    </p>
                    ) : (
                    <p className="approval-date">
                        <span>Decisión:</span> {new Date(item.fecha_decision).toLocaleDateString()}
                    </p>
                    )}
                </div>
                
                <div className="header-actions">
                    {renderStatusIcon(item.estado)}
                    <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(item.id);
                    }}
                    className="view-button"
                    >
                    <FontAwesomeIcon icon={faEye} /> {expandedId === item.id ? 'Ocultar' : 'Ver'}
                    </button>
                </div>
                </div>
                
                {expandedId === item.id && (
                <div className="item-details">
                    <div className="details-section">
                    <h4>Detalles de la Solicitud</h4>
                    <div className="details-grid">
                        {Object.entries(item.datos_completos).map(([key, value]) => (
                        key !== 'nombre_solicitante' && 
                        key !== 'departamento_origen' && 
                        key !== 'descripcion' && 
                        key !== 'fecha_solicitud' && (
                            <div key={key} className="detail-item">
                            <span className="detail-label">{key.replace(/_/g, ' ')}:</span>
                            <span className="detail-value">{String(value)}</span>
                            </div>
                        )
                        ))}
                    </div>
                    </div>
                    
                    <div className="approval-info">
                    <div className="approval-field">
                        <span>Aprobador:</span>
                        <span>{item.aprobador}</span>
                    </div>
                    <div className="approval-field">
                        <span>Origen:</span>
                        <span>{item.tabla_origen}</span>
                    </div>
                    <div className="approval-field">
                        <span>Estado:</span>
                        <span className={`status-text ${item.estado.toLowerCase()}`}>
                        {item.estado}
                        </span>
                    </div>
                    {isDelivered && item.entregado_por && (
                        <div className="approval-field">
                        <span>Entregado por:</span>
                        <span>{item.entregado_por}</span>
                        </div>
                    )}
                    </div>

                    {isDelivered && item.observaciones && (
                    <div className="delivery-observations">
                        <h4>Observaciones de entrega:</h4>
                        <p>{item.observaciones}</p>
                    </div>
                    )}

                    {showDeliveryButton && (
                    <div className="delivery-section">
                        <h4>Registrar Entrega</h4>
                        <div className="delivery-form">
                        <div className="form-group">
                            <label>Entregado por:</label>
                            <input
                            type="text"
                            name="entregado_por"
                            value={deliveryData.entregado_por}
                            onChange={handleDeliveryInputChange}
                            placeholder="Nombre de quien entrega"
                            required
                            disabled={isSubmitting}
                            />
                        </div>
                        <div className="form-group">
                            <label>Observaciones:</label>
                            <textarea
                            name="observaciones"
                            value={deliveryData.observaciones}
                            onChange={handleDeliveryInputChange}
                            placeholder="Notas adicionales"
                            rows={3}
                            disabled={isSubmitting}
                            />
                        </div>
                        <button 
                            onClick={() => handleDelivery(item.id)}
                            className="deliver-button"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                            'Procesando...'
                            ) : (
                            <>
                                <FontAwesomeIcon icon={faTruck} /> Marcar como Entregado
                            </>
                            )}
                        </button>
                        </div>
                    </div>
                    )}
                </div>
                )}
            </div>
            ))}
        </div>
        );
    };

    return (
        <div className="approval-list-container">
        <h2 className="list-title">
            {activeTab === 'approved' && 'Solicitudes Aprobadas'}
            {activeTab === 'pending' && 'Solicitudes Pendientes'}
            {activeTab === 'delivered' && 'Entregas Realizadas'}
        </h2>
        
        <div className="tabs">
            <button
            className={`tab-button ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('approved')}
            >
            Aprobadas
            </button>
            <button
            className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
            >
            Rechazadas
            </button>
            <button
            className={`tab-button ${activeTab === 'delivered' ? 'active' : ''}`}
            onClick={() => setActiveTab('delivered')}
            >
            Entregados
            </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {loading ? (
            <div className="loading-container">
            <div className="spinner"></div>
            <p>Cargando datos...</p>
            </div>
        ) : (
            <div className="content-container">
            {renderTabContent()}
            </div>
        )}
        </div>
    );
    };