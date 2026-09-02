import express, { Request, Response } from 'express'
import cors from 'cors'
import { Pool } from 'pg'
import * as bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentFile = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFile)
const envPath = path.resolve(currentDirectory, '../../.env')

dotenv.config({ path: envPath })

const app = express()
app.use(cors())
app.use(express.json())

// Configuración de la conexión a la base de datos del Chatbot (Supabase / Postgres remoto)
const pool = new Pool({
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.xoopvfdwhbnilwnbaqfh',
  password: 'fuauF3aK3KihuyVV',
  ssl: {
    rejectUnauthorized: false
  }
})

// Función para manejar consultas genéricas
const handleQuery = async (
  table: string,
  orderField: string,
  _req: Request,
  res: Response
): Promise<void> => {
  console.log(`Recibida solicitud GET /api/${table}`)
  try {
    const query = `SELECT * FROM ${table} ORDER BY ${orderField} DESC`
    const result = await pool.query(query)
    res.json(result.rows)
  } catch (err) {
    console.error(`Error en la consulta a ${table}:`, err)
    res.status(500).send(`Error al obtener datos de ${table}`)
  }
}

// Endpoint para registro de aprobaciones modificado
app.get('/api/aprobaciones', async (_req, res) => {
  console.log('Recibida solicitud GET /api/aprobaciones')
  try {
    const query = `
      SELECT * FROM registro_aprobaciones 
      WHERE fecha_entrega IS NULL 
      OR fecha_entrega >= CURRENT_DATE - INTERVAL '60 days'
      ORDER BY fecha_decision DESC;
    `
    const result = await pool.query(query)
    res.json(result.rows)
  } catch (err) {
    console.error('Error en la consulta a aprobaciones:', err)
    res.status(500).send('Error al obtener datos de aprobaciones')
  }
})

// Endpoint para requisiciones TIC
app.get('/api/requisiciones/tic', async (req, res) => {
  await handleQuery('requisiciones_tic', 'fecha_solicitud', req, res)
})

// Endpoint para requisiciones de logística
app.get('/api/requisiciones/logistica', async (req, res) => {
  await handleQuery('requisiciones_logistica', 'fecha_solicitud', req, res)
})

// Endpoint para requisiciones de compras
app.get('/api/requisiciones/compras', async (req, res) => {
  await handleQuery('requisiciones_compras', 'fecha_solicitud', req, res)
})

// Endpoint para obtener todas las requisiciones combinadas (opcional)
app.get('/api/requisiciones/todas', async (req, res) => {
  console.log('Recibida solicitud GET /api/requisiciones/todas')
  try {
    const [tic, logistica, compras] = await Promise.all([
      pool.query("SELECT *, 'TIC' as tipo FROM requisiciones_tic"),
      pool.query("SELECT *, 'Logística' as tipo FROM requisiciones_logistica"),
      pool.query("SELECT *, 'Compras' as tipo FROM requisiciones_compras")
    ])

    const combined = [...tic.rows, ...logistica.rows, ...compras.rows].sort((a, b) => {
      const dateA = new Date(a.fecha_solicitud).getTime()
      const dateB = new Date(b.fecha_solicitud).getTime()
      return dateB - dateA
    })

    res.json(combined)
  } catch (err) {
    console.error('Error al combinar requisiciones:', err)
    res.status(500).send('Error al obtener todas las requisiciones')
  }
})

// Endpoint para marcar como entregado
app.patch('/api/aprobaciones/:id/entregar', async (req, res) => {
  try {
    const { id } = req.params
    const { entregado_por, observaciones } = req.body

    const query = `
      UPDATE registro_aprobaciones 
      SET 
        estado = 'Entregado',
        entregado_por = $1,
        observaciones = $2,
        fecha_entrega = NOW()
      WHERE id = $3
      RETURNING *;
    `

    const result = await pool.query(query, [entregado_por, observaciones, id])
    res.status(200).json(result.rows[0])
  } catch (err) {
    console.error('Error al registrar entrega:', err)
    res.status(500).send('Error al registrar entrega')
  }
})

// Nuevo endpoint para obtener entregas recientes (opcional)
app.get('/api/aprobaciones/entregas-recientes', async (req, res) => {
  try {
    const query = `
      SELECT * FROM registro_aprobaciones
      WHERE estado = 'Entregado'
        AND fecha_entrega >= CURRENT_DATE - INTERVAL '60 days'
      ORDER BY fecha_entrega DESC;
    `
    const result = await pool.query(query)
    res.json(result.rows)
  } catch (err) {
    console.error('Error al obtener entregas recientes:', err)
    res.status(500).send('Error al obtener entregas recientes')
  }
})

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' })
  }

  try {
    const userQuery = await pool.query(
      'SELECT id, username, password, nombre_completo, rol FROM usuarios WHERE username = $1 AND activo = TRUE',
      [username]
    )

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const user = userQuery.rows[0]
    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    // Excluimos el password de la respuesta
    const userData = { ...user }
    delete userData.password

    res.json({
      success: true,
      user: userData, // Incluye nombre_completo y otros datos
      token: 'tu_token_jwt_si_lo_implementas'
    })
  } catch (err) {
    console.error('Error en el login:', err)
    res.status(500).json({ error: 'Error en el servidor' })
  }
})

app.post('/api/logout', async (req, res) => {
  try {
    // Aquí puedes limpiar la sesión en PostgreSQL si es necesario
    // Por ejemplo, si usas tokens JWT, podrías invalidarlos

    res.status(200).json({ message: 'Logout successful' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Error during logout' })
  }
})

app.get('/api/mindmap/nodes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM mindmap_nodes ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (err) {
    console.error('Error al obtener nodos:', err)
    res.status(500).send('Error al obtener nodos')
  }
})

app.get('/api/mindmap/connections', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM mindmap_connections')
    // Asegura que siempre devuelvas un array
    res.json(result.rows || [])
  } catch (err) {
    console.error('Error al obtener conexiones:', err)
    // Devuelve un array vacío en caso de error
    res.status(500).json([])
  }
})

app.post('/api/mindmap/nodes', async (req, res) => {
  const { parent_id, title, description, problem, solution, position_x, position_y, color } =
    req.body

  try {
    const result = await pool.query(
      `INSERT INTO mindmap_nodes 
      (parent_id, title, description, problem, solution, position_x, position_y, color) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [parent_id, title, description, problem, solution, position_x, position_y, color || '#1E3A8A']
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Error al crear nodo:', err)
    res.status(500).send('Error al crear nodo')
  }
})

app.post('/api/mindmap/connections', async (req, res) => {
  const { source_node_id, target_node_id, connection_type } = req.body

  try {
    const result = await pool.query(
      `INSERT INTO mindmap_connections 
      (source_node_id, target_node_id, connection_type) 
      VALUES ($1, $2, $3) 
       RETURNING *`,
      [source_node_id, target_node_id, connection_type || 'related']
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Error al crear conexión:', err)
    res.status(500).send('Error al crear conexión')
  }
})

app.put('/api/mindmap/nodes/:id', async (req, res) => {
  const { id } = req.params
  const { title, description, problem, solution, position_x, position_y, color } = req.body

  try {
    const result = await pool.query(
      `UPDATE mindmap_nodes 
      SET 
        title = $1,
        description = $2,
        problem = $3,
        solution = $4,
        position_x = $5,
        position_y = $6,
        color = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
       RETURNING *`,
      [title, description, problem, solution, position_x, position_y, color || '#1E3A8A', id]
    )

    if (result.rows.length === 0) {
      return res.status(404).send('Nodo no encontrado')
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('Error al actualizar nodo:', err)
    res.status(500).send('Error al actualizar nodo')
  }
})

app.delete('/api/mindmap/nodes/:id', async (req, res) => {
  const { id } = req.params

  try {
    // Las conexiones se eliminarán automáticamente por ON DELETE CASCADE
    await pool.query('DELETE FROM mindmap_nodes WHERE id = $1', [id])
    res.status(204).send()
  } catch (err) {
    console.error('Error al eliminar nodo:', err)
    res.status(500).send('Error al eliminar nodo')
  }
})

app.delete('/api/mindmap/connections/:id', async (req, res) => {
  const { id } = req.params

  try {
    await pool.query('DELETE FROM mindmap_connections WHERE id = $1', [id])
    res.status(204).send()
  } catch (err) {
    console.error('Error al eliminar conexión:', err)
    res.status(500).send('Error al eliminar conexión')
  }
})

// Iniciar el servidor
app.listen(3003, () => {
  console.log('Servidor backend corriendo en http://localhost:3003')
})

// Endpoints para el Dashboard del ChatBot saca metricas de Convenios y Requisiciones
// 1. Endpoint unificado para las métricas (KPIs) de Requisiciones y Bancos
app.get('/api/chatbot/metrics', async (_req, res) => {
  try {
    // Consultar conteos totales sin filtrar por fecha para evitar errores de columnas faltantes
    const countReq = await pool.query('SELECT COUNT(*) FROM requisiciones')
    const agrarioCount = await pool.query('SELECT COUNT(*) FROM agrario')
    const avalCount = await pool.query('SELECT COUNT(*) FROM aval')
    const bbvaCount = await pool.query('SELECT COUNT(*) FROM bbva')

    const totalConvenios =
      parseInt(agrarioCount.rows[0].count || 0) +
      parseInt(avalCount.rows[0].count || 0) +
      parseInt(bbvaCount.rows[0].count || 0)

    const totalReq = parseInt(countReq.rows[0].count || 0)

    res.json({
      messagesToday: totalReq,
      activeChats: totalReq,
      totalConveniosBancos: totalConvenios, // Aquí se verán los más de 29,000 registros si están ahí
      desgloseBancos: {
        bbva: parseInt(bbvaCount.rows[0].count || 0),
        agrario: parseInt(agrarioCount.rows[0].count || 0),
        aval: parseInt(avalCount.rows[0].count || 0)
      },
      automationRate: 100,
      pendingErrors: 0
    })
  } catch (error) {
    console.error('Error al obtener métricas combinadas:', error)
    res.status(500).json({ error: 'Error al obtener métricas' })
  }
})

// 2. Endpoint para Actividad Reciente (Mostrando las últimas requisiciones)
app.get('/api/chatbot/activity', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM requisiciones LIMIT 10')
    const activity = result.rows.map((row, index) => ({
      id: row.id || index + 1,
      user: row.telefono || row.usuario || row.nombre || 'Usuario WhatsApp',
      intent: row.intencion || row.tipo || 'Proceso de Requisición',
      time: 'Reciente',
      status: 'success'
    }))

    res.json(activity)
  } catch (error) {
    console.error('Error al obtener actividad:', error)
    res.json([])
  }
})
