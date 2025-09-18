    import React, { useState, useEffect } from 'react';
    import axios from 'axios';
    import { motion, AnimatePresence } from 'framer-motion';
    import { 
    FiEye, 
    FiCheckCircle, 
    FiXCircle, 
    FiChevronDown, 
    FiChevronUp, 
    FiRefreshCw,
    FiSearch
    } from 'react-icons/fi';
    import styles from '../styles/RequisicionesView.module.css';

    interface Requisicion {
    id: number;
    nombre_solicitante: string;
    departamento_origen: string;
    descripcion: string;
    fecha_solicitud: string;
    tipo?: string;
    [key: string]: any;
    }

    export const RequisicionesView: React.FC = () => {
    const [requisiciones, setRequisiciones] = useState<Requisicion[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'tic' | 'logistica' | 'compras' | 'todas'>('todas');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');

    useEffect(() => {
        fetchRequisiciones();
    }, [activeTab]);

    const fetchRequisiciones = async () => {
        setLoading(true);
        setError(null);
        try {
        let endpoint = '/api/requisiciones/todas';
        if (activeTab !== 'todas') {
            endpoint = `/api/requisiciones/${activeTab}`;
        }

        const response = await axios.get(`http://localhost:3003${endpoint}`);
        setRequisiciones(response.data);
        } catch (err) {
        console.error('Error fetching requisiciones:', err);
        setError('Error al cargar las requisiciones');
        } finally {
        setLoading(false);
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const filteredRequisiciones = requisiciones.filter(req =>
        req.nombre_solicitante.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.departamento_origen.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    const getBadgeClass = (tipo?: string) => {
        switch (tipo) {
        case 'TIC':
            return styles.badgeTic;
        case 'Logística':
            return styles.badgeLogistica;
        case 'Compras':
            return styles.badgeCompras;
        default:
            return '';
        }
    };

    return (
        <div className={styles.container}>
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h1 className={styles.header}>Gestión de Requisiciones</h1>
            
            {/* Filtros y búsqueda */}
            <div className={styles.filterContainer}>
            <div className={styles.tabs}>
                {(['todas', 'tic', 'logistica', 'compras'] as const).map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`${styles.tab} ${
                    activeTab === tab ? styles.tabActive : styles.tabInactive
                    }`}
                >
                    {tab === 'todas' ? 'Todas' : 
                    tab === 'tic' ? 'TIC' : 
                    tab === 'logistica' ? 'Logística' : 'Compras'}
                </button>
                ))}
            </div>
            
            <div className={styles.searchContainer}>
                <FiSearch className={styles.searchIcon} size={18} />
                <input
                type="text"
                placeholder="Buscar requisiciones..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <button
                onClick={fetchRequisiciones}
                className={styles.refreshButton}
            >
                <FiRefreshCw className={loading ? styles.spinner : ''} />
                <span style={{ marginLeft: '8px' }}>Actualizar</span>
            </button>
            </div>
            
            {/* Contenido principal */}
            <div className={styles.requisicionList}>
            {loading ? (
                <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                </div>
            ) : error ? (
                <div className={styles.errorMessage}>{error}</div>
            ) : filteredRequisiciones.length === 0 ? (
                <div className={styles.emptyMessage}>No se encontraron requisiciones</div>
            ) : (
                <ul>
                <AnimatePresence>
                    {filteredRequisiciones.map((req) => (
                    <motion.li
                        key={req.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className={styles.requisicionItem}
                    >
                        <div className={styles.requisicionHeader}>
                        <div className={styles.requisicionInfo}>
                            <div className={styles.requisicionTitle}>
                            {req.tipo && (
                                <span className={`${styles.requisicionBadge} ${getBadgeClass(req.tipo)}`}>
                                {req.tipo}
                                </span>
                            )}
                            <h3 className={styles.requisicionName}>
                                {req.nombre_solicitante}
                            </h3>
                            </div>
                            <p className={styles.requisicionMeta}>
                            {req.departamento_origen} • {formatDate(req.fecha_solicitud)}
                            </p>
                            <p className={styles.requisicionDesc}>
                            {req.descripcion}
                            </p>
                        </div>
                        
                        <div className={styles.requisicionButtons}>
                            <button
                            onClick={() => toggleExpand(req.id)}
                            className={`${styles.button} ${styles.buttonView}`}
                            aria-label="Ver detalles"
                            >
                            <FiEye className={styles.buttonIcon} />
                            <span>Ver</span>
                            {expandedId === req.id ? (
                                <FiChevronUp style={{ marginLeft: '5px' }} />
                            ) : (
                                <FiChevronDown style={{ marginLeft: '5px' }} />
                            )}
                            </button>
                            
                            <button className={`${styles.button} ${styles.buttonApprove}`}>
                            <FiCheckCircle className={styles.buttonIcon} />
                            <span>Aprobar</span>
                            </button>
                            
                            <button className={`${styles.button} ${styles.buttonReject}`}>
                            <FiXCircle className={styles.buttonIcon} />
                            <span>Rechazar</span>
                            </button>
                        </div>
                        </div>
                        
                        <AnimatePresence>
                        {expandedId === req.id && (
                            <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className={styles.detailsContainer}
                            >
                            <div className={styles.detailsGrid}>
                                {Object.entries(req)
                                .filter(([key]) => !['id', 'nombre_solicitante', 'departamento_origen', 'descripcion', 'fecha_solicitud', 'tipo'].includes(key))
                                .map(([key, value]) => (
                                    <div key={key} className={styles.detailItem}>
                                    <div className={styles.detailLabel}>
                                        {key.replace(/_/g, ' ')}
                                    </div>
                                    <div className={styles.detailValue}>
                                        {typeof value === 'string' ? value : JSON.stringify(value)}
                                    </div>
                                    </div>
                                ))}
                            </div>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </motion.li>
                    ))}
                </AnimatePresence>
                </ul>
            )}
            </div>
        </motion.div>
        </div>
    );
    };
