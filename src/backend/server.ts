import dotenv from 'dotenv'
import express, { Request, Response } from 'express'
import cors from 'cors'
import { Pool } from 'pg'
import * as bcrypt from 'bcryptjs'
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
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
})

export default pool

// Función para registrar errores del servidor en la tabla (errores_api)
const registrarErrorServidor = async (error: unknown, origen: string): Promise<void> => {
  try {
    await pool.query(
      `INSERT INTO errores_api (mensaje, origen, telefono, resuelto, fecha) 
       VALUES ($1, $2, $3, false, NOW())`,
      [(error as Error)?.message || 'Error desconocido', origen, null]
    )
  } catch (dbErr) {
    console.error('No se pudo guardar el error en Supabase:', dbErr)
  }
}

console.log('✅ Keep-alive para Supabase activado')

// Ping cada 2 días para que Supabase no pause la bd
setInterval(
  async () => {
    try {
      await pool.query('SELECT 1')
      console.log(
        'Ping a Supabase OK -',
        new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })
      )
    } catch (e) {
      console.error('Ping falló', e)
    }
  },
  1000 * 60 * 60 * 24 * 2
)

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
    await registrarErrorServidor(err, `/api/${table}`)
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
  } catch (error) {
    console.error('Error en la consulta a aprobaciones:', error)
    await registrarErrorServidor(error, '/api/aprobaciones')
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
  } catch (error) {
    console.error('Error al combinar requisiciones:', error)
    await registrarErrorServidor(error, '/api/requisiciones/todas')
    res.status(500).send('Error al obtener todas las requisiciones')
  }
})

// Endpoint para marcar como entregado
app.patch('/api/aprobaciones/:id/entregar', async (req, res) => {
  const { id } = req.params

  try {
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
  } catch (error) {
    console.error('Error al registrar entrega:', error)
    await registrarErrorServidor(error, `/api/aprobaciones/${id}/entregar`)
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
  } catch (error) {
    console.error('Error al obtener entregas recientes:', error)
    await registrarErrorServidor(error, '/api/aprobaciones/entregas-recientes')
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
  } catch (error) {
    console.error('Error en el login:', error)
    await registrarErrorServidor(error, '/api/login')
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
    await registrarErrorServidor(error, '/api/logout')
    res.status(500).json({ error: 'Error during logout' })
  }
})

app.get('/api/mindmap/nodes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM mindmap_nodes ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (error) {
    console.error('Error al obtener nodos:', error)
    await registrarErrorServidor(error, '/api/mindmap/nodes')
    res.status(500).send('Error al obtener nodos')
  }
})

app.get('/api/mindmap/connections', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM mindmap_connections')
    // Asegura que siempre devuelvas un array
    res.json(result.rows || [])
  } catch (error) {
    console.error('Error al obtener conexiones:', error)
    await registrarErrorServidor(error, '/api/mindmap/connections')
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
  } catch (error) {
    console.error('Error al crear nodo:', error)
    await registrarErrorServidor(error, '/api/mindmap/nodes')
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
  } catch (error) {
    console.error('Error al crear conexión:', error)
    await registrarErrorServidor(error, '/api/mindmap/connections')
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
  } catch (error) {
    console.error('Error al actualizar nodo:', error)
    await registrarErrorServidor(error, `/api/mindmap/nodes/${id}`)
    res.status(500).send('Error al actualizar nodo')
  }
})

app.delete('/api/mindmap/nodes/:id', async (req, res) => {
  const { id } = req.params

  try {
    // Las conexiones se eliminarán automáticamente por ON DELETE CASCADE
    await pool.query('DELETE FROM mindmap_nodes WHERE id = $1', [id])
    res.status(204).send()
  } catch (error) {
    console.error('Error al eliminar nodo:', error)
    await registrarErrorServidor(error, `/api/mindmap/nodes/${id}`)
    res.status(500).send('Error al eliminar nodo')
  }
})

app.delete('/api/mindmap/connections/:id', async (req, res) => {
  const { id } = req.params

  try {
    await pool.query('DELETE FROM mindmap_connections WHERE id = $1', [id])
    res.status(204).send()
  } catch (error) {
    console.error('Error al eliminar conexión:', error)
    await registrarErrorServidor(error, `/api/mindmap/connections/${id}`)
    res.status(500).send('Error al eliminar conexión')
  }
})

// Iniciar el servidor
app.listen(3003, () => {
  console.log('Servidor backend corriendo en http://localhost:3003')
})

// Endpoint unificado para las métricas (KPIs) de Requisiciones, Bancos, Sesiones e Interacciones en vivo
app.get('/api/chatbot/metrics', async (_req, res) => {
  try {
    // Total de convenios de los bancos (29.230 registros)
    const conteoAgrario = await pool.query('SELECT COUNT(*) FROM agrario')
    const conteoAval = await pool.query('SELECT COUNT(*) FROM aval')
    const conteoBbva = await pool.query('SELECT COUNT(*) FROM bbva')
    const totalConveniosBancos =
      parseInt(conteoAgrario.rows[0].count || 0) +
      parseInt(conteoAval.rows[0].count || 0) +
      parseInt(conteoBbva.rows[0].count || 0)

    // Total Histórico de Usuarios (únicos y repetidos tabla total_historico_usuarios)
    const historicoQuery = await pool.query('SELECT COUNT(*) FROM total_historico_usuarios')
    const totalHistoricoUsuarios = parseInt(historicoQuery.rows[0].count || 0)

    // Suma total de mensajes procesados en las últimas 24h
    const consultaMensajesHoy = await pool.query(
      "SELECT SUM(total_mensajes) as total FROM sesiones_chat WHERE ultimo_mensaje >= NOW() - INTERVAL '24 hours'"
    )
    const totalMensajesHoy = parseInt(consultaMensajesHoy.rows[0].total || 0)

    // Chats Activos (número de usuarios únicos en las últimas 24h tabla sesiones_chat)
    const consultaChats24h = await pool.query(
      "SELECT COUNT(*) FROM sesiones_chat WHERE ultimo_mensaje >= NOW() - INTERVAL '24 hours'"
    )
    const totalChatsActivos = parseInt(consultaChats24h.rows[0].count || 0)

    // Errores pendientes por resolver en la tabla errores_api
    const conteoErroresApi = await pool.query(
      'SELECT COUNT(*) FROM errores_api WHERE resuelto = false'
    )
    const pendingErrors = parseInt(conteoErroresApi.rows[0].count || 0)

    // Errores en las últimas 24h para calcular la tasa de automatización (automationRate) del bot
    const errors24hRes = await pool.query(
      "SELECT COUNT(*) FROM errores_api WHERE fecha >= NOW() - INTERVAL '24 hours'"
    )
    const errors24h = parseInt(errors24hRes.rows[0].count || 0)

    // Cálculo % dinámico de la tasa de automatización del bot
    let automationRate = 100
    if (totalMensajesHoy > 0) {
      const rate = ((totalMensajesHoy - errors24h) / totalMensajesHoy) * 100
      automationRate = Math.max(0, Number(rate.toFixed(1)))
    }

    // Medir latencia real con un ping a Supabase/PostgreSQL/Builderbot
    const hacerPing = Date.now()
    await pool.query('SELECT 1')
    const latenciaMs = Date.now() - hacerPing

    // Verificar la última interacción para saber si Meta / BuilderBot están activos
    const ultimaActividadRes = await pool.query(
      'SELECT ultimo_mensaje FROM sesiones_chat ORDER BY ultimo_mensaje DESC LIMIT 1'
    )
    const ultimoMsj = ultimaActividadRes.rows[0]?.ultimo_mensaje
    const ahora = new Date()
    const diferenciaMinutos = ultimoMsj
      ? (ahora.getTime() - new Date(ultimoMsj).getTime()) / 60000
      : 999

    const metaConectado = diferenciaMinutos < 1440 // Si hubo actividad en las últimas 24h
    const uptimePorcentaje = 100 // O calcular uptime de Node con process.uptime()

    res.json({
      messagesToday: totalMensajesHoy,
      activeChats: totalChatsActivos,
      totalConveniosBancos: totalConveniosBancos,
      totalHistoricoUsuarios: totalHistoricoUsuarios,
      desgloseBancos: {
        bbva: parseInt(conteoBbva.rows[0].count || 0),
        agrario: parseInt(conteoAgrario.rows[0].count || 0),
        aval: parseInt(conteoAval.rows[0].count || 0)
      },
      automationRate: automationRate,
      pendingErrors: pendingErrors,
      saludServidores: {
        serverStatus: `Online (${uptimePorcentaje}%)`,
        metaApiStatus: metaConectado ? 'Conectado' : 'Sin actividad reciente',
        latencyMs: `${latenciaMs} ms`,
        builderBotStatus: metaConectado ? 'Estable' : 'Revisar'
      }
    })
  } catch (error) {
    console.error('Error al obtener métricas:', error)
    await registrarErrorServidor(error, '/api/chatbot/metrics')
    res.status(500).json({ error: 'Error al obtener métricas' })
  }
})

// Endpoint para que el bot registre errores de API o de ejecución
app.post('/api/chatbot/log-error', async (req, res) => {
  try {
    const { mensaje, origen, telefono } = req.body

    await pool.query(
      `INSERT INTO errores_api (mensaje, origen, telefono, resuelto, fecha) 
       VALUES ($1, $2, $3, false, NOW())`,
      [mensaje || 'Error desconocido', origen || 'Bot', telefono || null]
    )

    res.status(201).json({ status: 'ok', message: 'Error registrado correctamente' })
  } catch (error) {
    console.error('Error al guardar log de error en /api/chatbot/log-error:', error)
    res.status(500).json({ error: 'No se pudo registrar el error' })
  }
})

// Endpoint de Actividad Reciente en Vivo
app.get('/api/chatbot/activity', async (_req, res) => {
  try {
    // Trae las últimas interacciones convirtiendo el timestamp a la zona horaria de Bogotá
    const resultadoActividad = await pool.query(
      `SELECT id, telefono, nombre, ultima_accion, 
              (ultimo_mensaje AT TIME ZONE 'America/Bogota') as ultimo_mensaje 
       FROM sesiones_chat 
       ORDER BY ultimo_mensaje DESC LIMIT 10`
    )

    const listaActividad = resultadoActividad.rows.map((fila, indice) => ({
      id: fila.id || indice + 1,
      user: fila.nombre || fila.telefono || 'Usuario WhatsApp',
      intent: fila.ultima_accion || 'Interacción con el Bot',
      time: fila.ultimo_mensaje
        ? new Date(fila.ultimo_mensaje).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'Reciente',
      status: 'success'
    }))

    res.json(listaActividad)
  } catch (error) {
    console.error('Error al obtener actividad en vivo:', error)
    await registrarErrorServidor(error, '/api/chatbot/activity')
    res.json([])
  }
})
