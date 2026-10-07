/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { pool } from "../provider/database.js";

export class ConvenioService {
  static async buscar(texto: string) {
    const termino = `%${texto.toLowerCase()}%`;

    const [bbva, agrario, aval] = await Promise.all([
      pool.query(
        `
        SELECT
          'BBVA' AS banco,
          codigo_convenio,
          nombre_convenio,
          nit,
          que_se_recauda,
          categoria,
          tipo_captura,
          ubicacion,
          referencias,
          forma_consulta
        FROM bbva
        WHERE
          LOWER(nombre_convenio) LIKE $1
          OR LOWER(nit) LIKE $1
        `,
        [termino],
      ),

      pool.query(
        `
        SELECT
          'AGRARIO' AS banco,
          codigo_convenio,
          nombre_convenio,
          nit_convenio AS nit,
          referencia,
          tipo_referencia,
          longitud_referencia,
          codigo_barras,
          valida_fecha,
          manual
        FROM agrario
        WHERE
          LOWER(nombre_convenio) LIKE $1
          OR LOWER(nit_convenio) LIKE $1
        `,
        [termino],
      ),

      pool.query(
        `
        SELECT
          'AVAL' AS banco,
          nit AS codigo_convenio,
          convenio AS nombre_convenio,
          estado,
          nura,
          nit,
          empresa,
          convenio,
          sigla,
          categoria,
          descripcion_recaudo,
          dato_captura,
          modalidad,
          longitud_referencia,
          ciudad,
          departamento,
          modalidad_captura,
          valida_fecha_vencimiento,
          recibe_pagos_parciales,
          monto,
          banco_dueno
        FROM aval
        WHERE
          LOWER(convenio) LIKE $1
          OR LOWER(empresa) LIKE $1
          OR LOWER(sigla) LIKE $1
          OR LOWER(nit) LIKE $1
        `,
        [termino],
      ),
    ]);

    return {
      total: bbva.rows.length + agrario.rows.length + aval.rows.length,
      bbva: bbva.rows,
      agrario: agrario.rows,
      aval: aval.rows,
    };
  }

  static async obtenerPorId(banco: string, id: string) {
    switch (banco) {
      case "BBVA": {
        const { rows } = await pool.query(
          `
          SELECT
            'BBVA' AS banco,
            codigo_convenio,
            nombre_convenio,
            nit,
            que_se_recauda,
            categoria,
            tipo_captura,
            ubicacion,
            referencias,
            forma_consulta
          FROM bbva
          WHERE codigo_convenio = $1
          LIMIT 1
          `,
          [id],
        );
        return rows[0] ?? null;
      }

      case "AGRARIO": {
        const { rows } = await pool.query(
          `
          SELECT
            'AGRARIO' AS banco,
            codigo_convenio,
            nombre_convenio,
            nit_convenio AS nit,
            referencia,
            tipo_referencia,
            longitud_referencia,
            codigo_barras,
            valida_fecha,
            manual
          FROM agrario
          WHERE codigo_convenio = $1
          LIMIT 1
          `,
          [id],
        );
        return rows[0] ?? null;
      }

      case "AVAL": {
        const { rows } = await pool.query(
          `
          SELECT
            'AVAL' AS banco,
            nit AS codigo_convenio,
            convenio AS nombre_convenio,
            estado,
          nura,
          nit,
          empresa,
          convenio,
          sigla,
          categoria,
          descripcion_recaudo,
          dato_captura,
          modalidad,
          longitud_referencia,
          ciudad,
          departamento,
          modalidad_captura,
          valida_fecha_vencimiento,
          recibe_pagos_parciales,
          monto,
          banco_dueno
          FROM aval
          WHERE nit = $1
          LIMIT 1
          `,
          [id],
        );
        return rows[0] ?? null;
      }

      default:
        return null;
    }
  }

  static async sugerir(texto: string) {
    const [bbva, agrario, aval] = await Promise.all([
      pool.query(
        `
        SELECT
          nombre_convenio,
          similarity(lower(nombre_convenio), lower($1)) AS score
        FROM bbva
        ORDER BY score DESC
        LIMIT 1
        `,
        [texto],
      ),

      pool.query(
        `
        SELECT
          nombre_convenio,
          similarity(lower(nombre_convenio), lower($1)) AS score
        FROM agrario
        ORDER BY score DESC
        LIMIT 1
        `,
        [texto],
      ),

      pool.query(
        `
        SELECT
          convenio AS nombre_convenio,
          similarity(lower(convenio), lower($1)) AS score
        FROM aval
        ORDER BY score DESC
        LIMIT 1
        `,
        [texto],
      ),
    ]);

    const candidatos = [bbva.rows[0], agrario.rows[0], aval.rows[0]].filter(
      Boolean,
    );

    candidatos.sort((a: any, b: any) => b.score - a.score);

    return candidatos.length ? candidatos[0] : null;
  }

  static async crear(banco: string, datos: any) {
    switch (banco) {
      case "BBVA": {
        const codigo = datos.codigo_convenio || datos.codigo || datos.id;
        const nombreConv =
          datos.nombre_convenio || datos.nombre || datos.convenio;
        const nit = datos.nit || "0";
        const queSeRecauda = datos.que_se_recauda || "";
        const categoria = datos.categoria || "Otros";
        const tipoCaptura = datos.tipo_captura || "BARRAS";
        const ubicacion = datos.ubicacion || "NACIONAL";
        const refs = datos.referencias || "";
        const formaConsulta =
          datos.forma_consulta || datos.forma_consulta_datos || "N";

        const { rows } = await pool.query(
          `INSERT INTO bbva (codigo_convenio, nombre_convenio, nit, que_se_recauda, categoria, tipo_captura, ubicacion, referencias, forma_consulta) 
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
          [
            codigo,
            nombreConv,
            nit,
            queSeRecauda,
            categoria,
            tipoCaptura,
            ubicacion,
            refs,
            formaConsulta,
          ],
        );
        return rows[0];
      }
      case "AGRARIO": {
        const codigo = datos.codigo_convenio || datos.codigo || datos.id;
        const nombreConvenio = datos.nombre_convenio || datos.nombre;
        const nitConvenio = datos.nit_convenio || datos.nit;
        const referencia = datos.referencia || datos.descripcion;
        const tipoReferencia = datos.tipo_referencia || "";
        const longitudReferencia = datos.longitud_referencia || 0;
        const codigoBarras = datos.codigo_barras || "NO";
        const validaFecha = datos.valida_fecha || "NO";
        const manual = datos.manual || "SI";

        const { rows } = await pool.query(
          `INSERT INTO agrario (codigo_convenio, nombre_convenio, nit_convenio, referencia, tipo_referencia, longitud_referencia, codigo_barras, valida_fecha, manual) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
          [
            codigo,
            nombreConvenio,
            nitConvenio,
            referencia,
            tipoReferencia,
            longitudReferencia,
            codigoBarras,
            validaFecha,
            manual,
          ],
        );
        return rows[0];
      }
      case "AVAL": {
        const estado = datos.estado || "ACTIVO";
        const nura = datos.nura || "";
        const nit = datos.nit || "";
        const empresa = datos.empresa || "";
        const convenio =
          datos.convenio || datos.nombre_convenio || datos.nombre || "";
        const sigla = datos.sigla || "";
        const categoria = datos.categoria || "";
        const descripcionRecaudo =
          datos.descripcion_recaudo || datos.descripcion || "";
        const datoCaptura = datos.dato_captura || "";
        const modalidad = datos.modalidad || "";
        const longitudReferencia = datos.longitud_referencia || 0;
        const ciudad = datos.ciudad || "";
        const departamento = datos.departamento || "";
        const modalidadCaptura = datos.modalidad_captura || "";
        const validaFechaVencimiento = datos.valida_fecha_vencimiento || "NO";
        const recibePagosParciales = datos.recibe_pagos_parciales || "NO";
        const monto = datos.monto || "";
        const bancoDueno = datos.banco_dueno || "";

        const { rows } = await pool.query(
          `INSERT INTO aval (
            estado, nura, nit, empresa, convenio, sigla, categoria, 
            descripcion_recaudo, dato_captura, modalidad, longitud_referencia, 
            ciudad, departamento, modalidad_captura, valida_fecha_vencimiento, 
            recibe_pagos_parciales, monto, banco_dueno
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
          [
            estado,
            nura,
            nit,
            empresa,
            convenio,
            sigla,
            categoria,
            descripcionRecaudo,
            datoCaptura,
            modalidad,
            longitudReferencia,
            ciudad,
            departamento,
            modalidadCaptura,
            validaFechaVencimiento,
            recibePagosParciales,
            monto,
            bancoDueno,
          ],
        );
        return rows[0];
      }
      default:
        throw new Error("Banco no válido para creación");
    }
  }

  static async actualizar(banco: string, id: string, datos: any) {
    switch (banco) {
      case "BBVA": {
        const { rows } = await pool.query(
          `UPDATE bbva 
   SET nombre_convenio = COALESCE($1, nombre_convenio), 
       nit = COALESCE($2, nit), 
       que_se_recauda = COALESCE($3, que_se_recauda), 
       categoria = COALESCE($4, categoria), 
       tipo_captura = COALESCE($5, tipo_captura), 
       ubicacion = COALESCE($6, ubicacion), 
       referencias = COALESCE($7, referencias),
       forma_consulta = COALESCE($8, forma_consulta) 
   WHERE codigo_convenio = $9 
   RETURNING *`,
          [
            datos.nombre_convenio || datos.nombre,
            datos.nit,
            datos.que_se_recauda,
            datos.categoria,
            datos.tipo_captura,
            datos.ubicacion,
            datos.referencias,
            datos.forma_consulta || datos.forma_consulta_datos,
            id,
          ],
        );
        return rows[0];
      }
      case "AGRARIO": {
        const nombreConvenio = datos.nombre_convenio || datos.nombre;
        const nitConvenio = datos.nit_convenio || datos.nit;
        const referencia = datos.referencia || datos.descripcion;
        const tipoReferencia = datos.tipo_referencia;
        const longitudReferencia = datos.longitud_referencia;
        const codigoBarras = datos.codigo_barras;
        const validaFecha = datos.valida_fecha;
        const manual = datos.manual;

        const { rows } = await pool.query(
          `UPDATE agrario 
     SET nombre_convenio = COALESCE($1, nombre_convenio), 
         nit_convenio = COALESCE($2, nit_convenio), 
         referencia = COALESCE($3, referencia), 
         tipo_referencia = COALESCE($4, tipo_referencia), 
         longitud_referencia = COALESCE($5, longitud_referencia), 
         codigo_barras = COALESCE($6, codigo_barras), 
         valida_fecha = COALESCE($7, valida_fecha), 
         manual = COALESCE($8, manual) 
     WHERE codigo_convenio = $9 
     RETURNING *`,
          [
            nombreConvenio,
            nitConvenio,
            referencia,
            tipoReferencia,
            longitudReferencia,
            codigoBarras,
            validaFecha,
            manual,
            id,
          ],
        );
        return rows[0];
      }
      case "AVAL": {
        const estado = datos.estado;
        const nura = datos.nura;
        const nit = datos.nit ?? id;
        const empresa = datos.empresa;
        const convenio =
          datos.convenio || datos.nombre_convenio || datos.nombre || "";
        const sigla = datos.sigla;
        const categoria = datos.categoria;
        const descripcionRecaudo =
          datos.descripcion_recaudo || datos.descripcion || "";
        const datoCaptura = datos.dato_captura;
        const modalidad = datos.modalidad;
        const longitudReferencia = datos.longitud_referencia;
        const ciudad = datos.ciudad;
        const departamento = datos.departamento;
        const modalidadCaptura = datos.modalidad_captura;
        const validaFechaVencimiento = datos.valida_fecha_vencimiento;
        const recibePagosParciales = datos.recibe_pagos_parciales;
        const monto = datos.monto;
        const bancoDueno = datos.banco_dueno;

        const { rows } = await pool.query(
          `UPDATE aval 
           SET estado = COALESCE($1, estado), 
               nura = COALESCE($2, nura), 
               nit = COALESCE($3, nit), 
               empresa = COALESCE($4, empresa), 
               convenio = COALESCE($5, convenio), 
               sigla = COALESCE($6, sigla), 
               categoria = COALESCE($7, categoria), 
               descripcion_recaudo = COALESCE($8, descripcion_recaudo), 
               dato_captura = COALESCE($9, dato_captura), 
               modalidad = COALESCE($10, modalidad), 
               longitud_referencia = COALESCE($11, longitud_referencia), 
               ciudad = COALESCE($12, ciudad), 
               departamento = COALESCE($13, departamento), 
               modalidad_captura = COALESCE($14, modalidad_captura), 
               valida_fecha_vencimiento = COALESCE($15, valida_fecha_vencimiento), 
               recibe_pagos_parciales = COALESCE($16, recibe_pagos_parciales), 
               monto = COALESCE($17, monto), 
               banco_dueno = COALESCE($18, banco_dueno)
           WHERE nit = $3
           RETURNING *`,
          [
            estado,
            nura,
            nit,
            empresa,
            convenio,
            sigla,
            categoria,
            descripcionRecaudo,
            datoCaptura,
            modalidad,
            longitudReferencia,
            ciudad,
            departamento,
            modalidadCaptura,
            validaFechaVencimiento,
            recibePagosParciales,
            monto,
            bancoDueno,
          ],
        );
        return rows[0];
      }
      default:
        throw new Error("Banco no válido para actualización");
    }
  }

  static async eliminar(banco: string, id: string) {
    switch (banco) {
      case "BBVA": {
        await pool.query(`DELETE FROM bbva WHERE codigo_convenio = $1`, [id]);
        return true;
      }
      case "AGRARIO": {
        await pool.query(`DELETE FROM agrario WHERE codigo_convenio = $1`, [
          id,
        ]);
        return true;
      }
      case "AVAL": {
        await pool.query(`DELETE FROM aval WHERE nit = $1`, [id]);
        return true;
      }
      default:
        throw new Error("Banco no válido para eliminación");
    }
  }
}
