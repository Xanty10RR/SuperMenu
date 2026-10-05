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
          nit,
          empresa,
          sigla,
          modalidad,
          dato_captura,
          descripcion_recaudo
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
            nit,
            empresa,
            sigla,
            modalidad,
            dato_captura,
            descripcion_recaudo
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
        const {
          codigo_convenio,
          nombre_convenio,
          nombre,
          nit_convenio,
          nit,
          referencia,
          descripcion,
          tipo_referencia,
          longitud_referencia,
          codigo_barras,
          manual,
        } = datos;
        const { rows } = await pool.query(
          `INSERT INTO agrario (codigo_convenio, nombre_convenio, nit_convenio, referencia, tipo_referencia, longitud_referencia, codigo_barras, manual) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [
            codigo_convenio,
            nombre_convenio || nombre,
            nit_convenio || nit,
            referencia || descripcion,
            tipo_referencia,
            longitud_referencia,
            codigo_barras,
            manual,
          ],
        );
        return rows[0];
      }
      case "AVAL": {
        const {
          nit,
          convenio,
          nombre_convenio,
          nombre,
          empresa,
          sigla,
          modalidad,
          dato_captura,
          descripcion_recaudo,
          descripcion,
        } = datos;
        const { rows } = await pool.query(
          `INSERT INTO aval (nit, convenio, empresa, sigla, modalidad, dato_captura, descripcion_recaudo) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            nit,
            convenio || nombre_convenio || nombre,
            empresa,
            sigla,
            modalidad,
            dato_captura,
            descripcion_recaudo || descripcion,
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
        const manual = datos.manual;

        const { rows } = await pool.query(
          `UPDATE agrario 
           SET nombre_convenio = COALESCE($1, nombre_convenio), 
               nit_convenio = COALESCE($2, nit_convenio), 
               referencia = COALESCE($3, referencia), 
               tipo_referencia = COALESCE($4, tipo_referencia), 
               longitud_referencia = COALESCE($5, longitud_referencia), 
               codigo_barras = COALESCE($6, codigo_barras), 
               manual = COALESCE($7, manual) 
           WHERE codigo_convenio = $8 
           RETURNING *`,
          [
            nombreConvenio,
            nitConvenio,
            referencia,
            tipoReferencia,
            longitudReferencia,
            codigoBarras,
            manual,
            id,
          ],
        );
        return rows[0];
      }
      case "AVAL": {
        const convenio =
          datos.convenio || datos.nombre_convenio || datos.nombre;
        const nit = datos.nit;
        const empresa = datos.empresa;
        const sigla = datos.sigla;
        const modalidad = datos.modalidad;
        const datoCaptura = datos.dato_captura;
        const descripcionRecaudo =
          datos.descripcion_recaudo || datos.descripcion;

        const { rows } = await pool.query(
          `UPDATE aval 
           SET convenio = COALESCE($1, convenio), 
               nit = COALESCE($2, nit), 
               empresa = COALESCE($3, empresa), 
               sigla = COALESCE($4, sigla), 
               modalidad = COALESCE($5, modalidad), 
               dato_captura = COALESCE($6, dato_captura), 
               descripcion_recaudo = COALESCE($7, descripcion_recaudo) 
           WHERE nit = $8 
           RETURNING *`,
          [
            convenio,
            nit,
            empresa,
            sigla,
            modalidad,
            datoCaptura,
            descripcionRecaudo,
            id,
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
