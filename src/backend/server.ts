import dotenv from 'dotenv'
import express from 'express'
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

// Endpoint para obtener requisiciones filtradas por usuario y rol
app.get('/api/requisiciones/filtro', async (req, res) => {
  try {
    const { usuario, esAdmin } = req.query

    // Si es admin, traemos todo de la tabla única 'requisiciones'
    if (esAdmin === 'true' || usuario === 'admin') {
      const result = await pool.query('SELECT * FROM requisiciones ORDER BY id DESC')
      return res.json(result.rows)
    }

    // Si es un jefe de área, filtramos por su departamento correspondiente
    let deptoFiltro = 'IT/Sistemas'
    if (usuario === 'jefelogistica') deptoFiltro = 'Logística'
    else if (usuario === 'jefecomercial') deptoFiltro = 'Comercial'
    else if (usuario === 'jeferrhh') deptoFiltro = 'RRHH'

    // Asumiendo que tu tabla 'requisiciones' tiene una columna llamada 'departamento' o 'area'
    const result = await pool.query(
      'SELECT * FROM requisiciones WHERE departamento = $1 OR area = $1 ORDER BY id DESC',
      [deptoFiltro]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error al obtener requisiciones filtradas:', error)
    res.status(500).json({ error: 'Error al cargar las requisiciones' })
  }
})

// Endpoint Logística para el Historial de Solicitudes Aprobadas/Rechazadas (registro_aprobaciones)
app.get('/api/registro-aprobaciones', async (req, res) => {
  try {
    const { usuario, esAdmin } = req.query

    let query = 'SELECT * FROM registro_aprobaciones'
    const values: string[] = []

    // Si NO es admin, filtramos estrictamente por el aprobador que tomó la decisión
    if (esAdmin !== 'true' && usuario !== 'admin') {
      query += ' WHERE aprobador = $1'
      values.push(String(usuario ?? ''))
    }

    query += ' ORDER BY id DESC'
    const result = await pool.query(query, values)
    res.json(result.rows)
  } catch {
    res.status(500).json({ error: 'Error al cargar los datos' })
  }
})

// Endpoint de Usuarios para obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, usuario, departamento, tabla_asignada FROM usuarios_aprobadores ORDER BY id ASC'
    )
    res.json(result.rows)
  } catch {
    res.status(500).send('Error al obtener usuarios')
  }
})

// Crear un nuevo usuario aprobador
app.post('/api/usuarios', async (req, res) => {
  try {
    const { usuario, clave, departamento, tabla_asignada } = req.body
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(clave, salt)

    await pool.query(
      'INSERT INTO usuarios_aprobadores (usuario, clave, departamento, tabla_asignada) VALUES ($1, $2, $3, $4)',
      [usuario, hash, departamento, tabla_asignada || 'requisiciones']
    )
    res.status(201).send('Usuario creado con éxito')
  } catch {
    res.status(500).send('Error al crear usuario')
  }
})

// Eliminar usuario
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM usuarios_aprobadores WHERE id = $1', [id])
    res.send('Usuario eliminado')
  } catch {
    res.status(500).send('Error al eliminar usuario')
  }
})

// Endpoint para registro de aprobaciones
app.get('/api/aprobaciones', async (_req, res) => {
  console.log('Recibida solicitud GET /api/aprobaciones')
  try {
    const query = `
      SELECT * FROM registro_aprobaciones 
      ORDER BY id DESC LIMIT 100;
    `
    const result = await pool.query(query)
    res.json(result.rows)
  } catch (error) {
    console.error('Error en la consulta a aprobaciones:', error)
    res.status(500).send('Error al obtener datos de aprobaciones')
  }
})

// Endpoint para registrar una aprobación o rechazo de una Requisición en Gestión de Requisiciones
app.post('/api/aprobaciones', async (req, res) => {
  try {
    const { id_requisicion, estado, aprobador, datos_completos } = req.body

    const fechaDecision = new Date().toISOString()

    const query = `
      INSERT INTO registro_aprobaciones 
      (estado, aprobador, tabla_origen, fecha_decision, datos_completos) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *;
    `

    const values = [
      estado,
      aprobador || 'jefesistemas', // el usuario que esté logueado
      'requisiciones',
      fechaDecision,
      JSON.stringify(datos_completos)
    ]

    const result = await pool.query(query, values)

    // Actualizar el estado de la requisición original a aprobado o rechazado
    await pool.query('UPDATE requisiciones SET estado = $1 WHERE id = $2', [estado, id_requisicion])

    res.json({
      message: 'Acción registrada con éxito',
      registro: result.rows[0]
    })
  } catch (error) {
    console.error('Error al registrar la aprobación/rechazo:', error)
    res.status(500).send('Error al procesar la aprobación')
  }
})

// Endpoint para obtener todas las requisiciones pendientes
app.get('/api/requisiciones/todas', async (_req, res) => {
  console.log('Recibida solicitud GET /api/requisiciones/todas')
  try {
    const result = await pool.query(`
      SELECT * FROM requisiciones 
      WHERE estado IS NULL OR estado = 'pendiente' 
      ORDER BY id DESC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error('Error al obtener todas las requisiciones:', error)
    res.status(500).send('Error al obtener todas las requisiciones')
  }
})

// Endpoint para requisiciones IT/Sistemas pendientes
app.get('/api/requisiciones/tic', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM requisiciones 
      WHERE departamento ILIKE '%IT/Sistemas%' 
      AND (estado IS NULL OR estado = 'pendiente') 
      ORDER BY id DESC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error('Error al obtener requisiciones IT/Sistemas:', error)
    res.status(500).send('Error al obtener requisiciones IT/Sistemas')
  }
})

// Endpoint para requisiciones de Logística pendientes
app.get('/api/requisiciones/logistica', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM requisiciones 
      WHERE departamento ILIKE '%Logística%' 
      AND (estado IS NULL OR estado = 'pendiente') 
      ORDER BY id DESC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error('Error al obtener requisiciones de Logística:', error)
    res.status(500).send('Error al obtener requisiciones de Logística')
  }
})

// Endpoint para requisiciones de RRHH pendientes
app.get('/api/requisiciones/rrhh', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM requisiciones 
      WHERE departamento ILIKE '%RRHH%' 
      AND (estado IS NULL OR estado = 'pendiente') 
      ORDER BY id DESC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error('Error al obtener requisiciones de RRHH:', error)
    res.status(500).send('Error al obtener requisiciones de RRHH')
  }
})

// Endpoint para requisiciones de Comercial pendientes
app.get('/api/requisiciones/comercial', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM requisiciones 
      WHERE departamento ILIKE '%Comercial%' 
      AND (estado IS NULL OR estado = 'pendiente') 
      ORDER BY id DESC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error('Error al obtener requisiciones de Comercial:', error)
    res.status(500).send('Error al obtener requisiciones de Comercial')
  }
})

// Endpoint para requisiciones de Otros departamentos pendientes
app.get('/api/requisiciones/otros', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM requisiciones 
      WHERE departamento ILIKE '%Otros%' 
      AND (estado IS NULL OR estado = 'pendiente') 
      ORDER BY id DESC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error('Error al obtener requisiciones de otros departamentos:', error)
    res.status(500).send('Error al obtener requisiciones de otros departamentos')
  }
})

// Endpoint para registrar la entrega completa (con PATCH)
app.patch('/api/aprobaciones/:id/entregar', async (req, res) => {
  try {
    const { id } = req.params
    const { entregado_por, observaciones } = req.body

    const fechaActual = new Date().toISOString()

    await pool.query(
      `UPDATE registro_aprobaciones 
       SET fecha_entrega = $1, 
           entregado_por = $2, 
           observaciones = $3 
       WHERE id = $4`,
      [fechaActual, entregado_por, observaciones, id]
    )

    res.json({ message: 'Entrega registrada con éxito' })
  } catch (error) {
    console.error('Error al registrar entrega:', error)
    res.status(500).send('Error al registrar la entrega')
  }
})

// Nuevo
app.get('/api/aprobaciones/entregadas', async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM registro_aprobaciones WHERE fecha_entrega IS NOT NULL AND fecha_entrega != 'NULL' ORDER BY id DESC"
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error al obtener entregas:', error)
    await registrarErrorServidor(error, '/api/chatbot/metrics')
    res.status(500).send('Error al obtener entregas')
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

    // Flujos Conversacionales Ejecutados Hoy
    const consultaMensajesHoy = await pool.query(
      "SELECT SUM(total_mensajes) as total FROM sesiones_chat WHERE ultimo_mensaje >= NOW() - INTERVAL '24 hours'"
    )
    const totalMensajesHoy = parseInt(consultaMensajesHoy.rows[0].total || 0)

    // Chats Únicos Últimas 24h tabla (sesiones_chat)
    const consultaChats24h = await pool.query(
      "SELECT COUNT(*) FROM sesiones_chat WHERE ultimo_mensaje >= NOW() - INTERVAL '24 hours'"
    )
    const totalChatsActivos = parseInt(consultaChats24h.rows[0].count || 0)

    // Errores pendientes por resolver en la tabla errores_api
    const conteoErroresApi = await pool.query(
      'SELECT COUNT(*) FROM errores_api WHERE resuelto = false'
    )
    const pendingErrors = parseInt(conteoErroresApi.rows[0].count || 0)

    // Errores en las últimas 24h para referencia
    const errors24hRes = await pool.query(
      "SELECT COUNT(*) FROM errores_api WHERE fecha >= NOW() - INTERVAL '24 hours'"
    )
    const errors24h = parseInt(errors24hRes.rows[0].count || 0)

    // Cálculo % dinámico de la tasa de automatización del bot
    let automationRate = 100
    if (totalMensajesHoy > 0) {
      // Usamos el máximo entre los errores de 24h y los errores pendientes totales (resuelto = false) para que se refleje el estado real del bot
      const erroresTotales = Math.max(errors24h, pendingErrors)

      const rate = ((totalMensajesHoy - erroresTotales) / totalMensajesHoy) * 100
      automationRate = Math.max(0, Number(rate.toFixed(1)))
    }

    // Estado del Servidor y API
    // Función para formatear el tiempo activo (uptime) del servidor en Render
    function formatUptime(seconds: number): string {
      const days = Math.floor(seconds / (3600 * 24))
      const hours = Math.floor((seconds % (3600 * 24)) / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)

      if (days > 0) {
        return `Online • ${days}d ${hours}h activo`
      }
      if (hours > 0) {
        return `Online • ${hours}h ${minutes}m activo`
      }
      return `Online • ${minutes}m activo`
    }

    // Servidor Web (Render) con Uptime
    const uptimeSegundos = process.uptime()
    const serverStatus = formatUptime(uptimeSegundos)

    // Meta Cloud API (Webhook): Última interacción
    const ultimaActividadRes = await pool.query(
      'SELECT ultimo_mensaje FROM sesiones_chat ORDER BY ultimo_mensaje DESC LIMIT 1'
    )

    const ultimoMsjDate = ultimaActividadRes.rows[0]?.ultimo_mensaje
      ? new Date(ultimaActividadRes.rows[0].ultimo_mensaje)
      : null

    const ahora = new Date()
    let metaTexto = 'Sin actividad reciente'
    let metaConectado = false

    if (ultimoMsjDate) {
      const diffSegundos = Math.floor((ahora.getTime() - ultimoMsjDate.getTime()) / 1000)
      const diffMinutos = Math.floor(diffSegundos / 60)
      const diffHoras = Math.floor(diffMinutos / 60)

      let tiempoRelativo = ''
      if (diffSegundos < 60) {
        tiempoRelativo = `hace ${diffSegundos} seg`
      } else if (diffMinutos < 60) {
        tiempoRelativo = `hace ${diffMinutos} min`
      } else if (diffHoras < 24) {
        tiempoRelativo = `hace ${diffHoras} h`
      } else {
        tiempoRelativo = `hace más de 1 día`
      }

      metaConectado = diffSegundos < 86400 // Activo si hubo movimiento en 24h
      metaTexto = metaConectado
        ? `Conectado • Últ. vez: ${tiempoRelativo}`
        : `Inactivo • Últ. vez: ${tiempoRelativo}`
    }

    // Supabase (Base de Datos - Servidor) + Almacenamiento MB
    let supabaseStatusText = 'Conectado'
    try {
      const sizeRes = await pool.query('SELECT pg_database_size(current_database()) AS size')
      const bytes = parseInt(sizeRes.rows[0]?.size || 0, 10)
      const usedMB = (bytes / (1024 * 1024)).toFixed(1)
      // Plan gratuito de Supabase de 500 MB
      supabaseStatusText = `Conectado • Storage: ${usedMB} / 500 MB`
    } catch {
      supabaseStatusText = 'Desconectado'
    }

    // Latencia Base de Datos PostgreSQL (Ping real)
    const hacerPing = Date.now()
    let latenciaMs = 0

    try {
      await pool.query('SELECT 1')
      latenciaMs = Date.now() - hacerPing
    } catch {
      latenciaMs = 999
    }

    // Respuesta estructurada al Dashboard
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
        serverStatus: serverStatus, // Servidor Web (Render)
        metaApiStatus: metaTexto, // Meta Cloud API (Webhook)
        supabaseStatus: supabaseStatusText, // Supabase (Base de Datos)
        builderBotStatus: metaConectado ? 'Estable' : 'Revisar', // Motor BuilderBot
        latencyMs: `${latenciaMs} ms` // Latencia Base de Datos PostgreSQL
      }
    })
  } catch (error) {
    console.error('Error al obtener métricas del chatbot:', error)
    await registrarErrorServidor(error, '/api/chatbot/metrics')
    res.status(500).json({ error: 'No se pudieron obtener las métricas' })
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
