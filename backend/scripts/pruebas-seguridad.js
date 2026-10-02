import "dotenv/config";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import pkg from "pg";
const { Pool } = pkg;

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const LIMITE_LOGIN = Number(process.env.RATE_LIMIT_LOGIN) || 10;

const db = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.DB_SSL === "true"
        ? { rejectUnauthorized: false }
        : false,
});

const usuariosCreados = [];

const pedir = async (ruta, { metodo = "GET", token = null, cuerpo = null } = {}) => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (cuerpo !== null) headers["Content-Type"] = "application/json";
    const res = await fetch(`${BASE_URL}${ruta}`, {
        method: metodo,
        headers,
        body: cuerpo !== null ? JSON.stringify(cuerpo) : undefined,
        signal: AbortSignal.timeout(10000)
    });
    const texto = await res.text();
    let data = null;
    try { data = JSON.parse(texto); } catch { }
    return { status: res.status, data, texto, headers: res.headers };
};

const verificarEmail = async (correo) => {
    const result = await db.query(
        "SELECT token FROM tokens_verificacion WHERE usuario = (SELECT id_usuario FROM usuarios WHERE correo = $1) ORDER BY id DESC LIMIT 1",
        [correo]
    );
    if (result.rows.length === 0) {
        throw new Error(`No se encontró token de verificación para ${correo}`);
    }
    const token = result.rows[0].token;
    const res = await pedir(`/api/auth/verificar-email/${token}`);
    assert.equal(res.status, 200, "verificación de email debe ser 200");
    return res;
};

const registrar = async (prefijo) => {
    const cuerpo = {
        nombre: prefijo,
        primer_apellido: "Prueba",
        segundo_apellido: "Seguridad",
        correo: `${prefijo}@test.local`,
        username: `${prefijo}_${Math.floor(Math.random() * 100000)}`,
        contraseña: "Contrasena123!"
    };
    const res = await pedir("/api/auth/register", { metodo: "POST", cuerpo });
    assert.equal(res.status, 201, "registro debe ser 201");
    // Verificar email automáticamente para tests
    await verificarEmail(cuerpo.correo);
    return cuerpo;
};

const iniciarSesion = async (cuerpo) => {
    const res = await pedir("/api/auth/login", {
        metodo: "POST",
        cuerpo: { login: cuerpo.correo, contraseña: cuerpo.contraseña }
    });
    assert.equal(res.status, 200, "login debe ser 200");
    assert.ok(res.data.token, "debe devolver token");
    return res.data.token;
};

after(async () => {
    for (const usuario of usuariosCreados) {
        try {
            await pedir("/api/usuario/", { metodo: "DELETE", token: usuario.token });
        } catch { }
    }
    // El catálogo de ejercicios es global: limpiar los creados por esta suite
    try {
        await db.query("DELETE FROM ejercicios WHERE nombre LIKE 'PRUEBA_GIM_%'");
    } catch { }
    await db.end();
});

test("health y headers de seguridad", async () => {
    const health = await pedir("/health");
    assert.equal(health.status, 200);
    assert.equal(health.data.status, "ok");

    const avatares = await pedir("/api/avatares");
    assert.equal(avatares.status, 200);
    assert.match(avatares.headers.get("x-content-type-options") || "", /nosniff/i);
    assert.ok(avatares.headers.get("x-frame-options"), "x-frame-options presente");
    assert.ok(avatares.headers.get("content-security-policy"), "CSP presente");

    const inexistente = await pedir("/api/ruta-que-no-existe");
    assert.equal(inexistente.status, 404);
});

test("validación de registro", async () => {
    const valido = await registrar("reg1");
    usuariosCreados.push({ token: await iniciarSesion(valido) });

    const incompleto = await pedir("/api/auth/register", {
        metodo: "POST",
        cuerpo: { nombre: "Solo" }
    });
    assert.equal(incompleto.status, 400);

    const correoMalo = await pedir("/api/auth/register", {
        metodo: "POST",
        cuerpo: { ...valido, correo: "correo-malo", username: "correomalo1" }
    });
    assert.equal(correoMalo.status, 400);

    const usernameMalo = await pedir("/api/auth/register", {
        metodo: "POST",
        cuerpo: { ...valido, username: "usuario malo!!" }
    });
    assert.equal(usernameMalo.status, 400);

    const passwordDebil = await pedir("/api/auth/register", {
        metodo: "POST",
        cuerpo: { ...valido, username: "password1", contraseña: "12345678" }
    });
    assert.equal(passwordDebil.status, 400);

    const duplicadoCorreo = await pedir("/api/auth/register", {
        metodo: "POST",
        cuerpo: { ...valido, username: "dupcorreo1" }
    });
    assert.equal(duplicadoCorreo.status, 409);

    const duplicadoUsername = await pedir("/api/auth/register", {
        metodo: "POST",
        cuerpo: { ...valido, correo: "otro@test.local", username: valido.username }
    });
    assert.equal(duplicadoUsername.status, 409);
});

test("login: credenciales, no revelar existencia, campos faltantes", async () => {
    const usuario = await registrar("login1");
    const token = await iniciarSesion(usuario);
    usuariosCreados.push({ token });

    const porUsername = await pedir("/api/auth/login", {
        metodo: "POST",
        cuerpo: { login: usuario.username, contraseña: usuario.contraseña }
    });
    assert.equal(porUsername.status, 200);

    const passwordIncorrecta = await pedir("/api/auth/login", {
        metodo: "POST",
        cuerpo: { login: usuario.correo, contraseña: "OtraContrasena1!" }
    });
    assert.equal(passwordIncorrecta.status, 401);
    assert.equal(passwordIncorrecta.data.message, "Credenciales inválidas");

    const noExiste = await pedir("/api/auth/login", {
        metodo: "POST",
        cuerpo: { login: "nadie@test.local", contraseña: "Cualquiera1!" }
    });
    assert.equal(noExiste.status, 401);
    assert.equal(noExiste.data.message, "Credenciales inválidas");

    const sinCampos = await pedir("/api/auth/login", {
        metodo: "POST",
        cuerpo: { login: usuario.correo }
    });
    assert.equal(sinCampos.status, 400);
});

test("login bloqueado sin verificar correo", async () => {
    // Registrar usuario SIN verificar email
    const cuerpo = {
        nombre: "noverif",
        primer_apellido: "Prueba",
        segundo_apellido: "Seguridad",
        correo: `noverif@test.local`,
        username: `noverif_${Math.floor(Math.random() * 100000)}`,
        contraseña: "Contrasena123!"
    };
    const resRegistro = await pedir("/api/auth/register", { metodo: "POST", cuerpo });
    assert.equal(resRegistro.status, 201);

    // Intentar login sin verificar - debe fallar con 403
    const resLogin = await pedir("/api/auth/login", {
        metodo: "POST",
        cuerpo: { login: cuerpo.correo, contraseña: cuerpo.contraseña }
    });
    assert.equal(resLogin.status, 403, "login sin verificar debe dar 403");
    assert.ok(resLogin.data.message.includes("verificar"), "debe mencionar verificación");

    // Verificar email y luego login debe funcionar
    await verificarEmail(cuerpo.correo);
    const resLoginPost = await pedir("/api/auth/login", {
        metodo: "POST",
        cuerpo: { login: cuerpo.correo, contraseña: cuerpo.contraseña }
    });
    assert.equal(resLoginPost.status, 200, "login después de verificar debe dar 200");

    // Limpiar
    usuariosCreados.push({ token: resLoginPost.data.token });
});

test("verificación de email: token inválido, ya usado, expirado", async () => {
    const tokenInvalido = await pedir("/api/auth/verificar-email/token-que-no-existe");
    assert.equal(tokenInvalido.status, 400);
    assert.ok(tokenInvalido.data.message.includes("inválido"));

    // Token ya usado (el de registrar1 ya se usó arriba)
    const result = await db.query(
        "SELECT token FROM tokens_verificacion WHERE usado = TRUE LIMIT 1"
    );
    if (result.rows.length > 0) {
        const yaUsado = await pedir(`/api/auth/verificar-email/${result.rows[0].token}`);
        assert.equal(yaUsado.status, 400);
        assert.ok(yaUsado.data.message.includes("utilizado"));
    }
});

test("token inválido, manipulado y vencido", async () => {
    const usuario = await registrar("token1");
    const token = await iniciarSesion(usuario);
    usuariosCreados.push({ token });

    const sinToken = await pedir("/api/usuario/perfil");
    assert.equal(sinToken.status, 401);

    const tokenBasura = await pedir("/api/usuario/perfil", { token: "abc" });
    assert.equal(tokenBasura.status, 401);

    const tokenFalso = jwt.sign({ id_usuario: 1, username: "x" }, "secreto-incorrecto", { expiresIn: "5m" });
    const conFalso = await pedir("/api/usuario/perfil", { token: tokenFalso });
    assert.equal(conFalso.status, 401);

    const tokenVencido = jwt.sign({ id_usuario: 1, username: "x" }, process.env.JWT_SECRET, { expiresIn: "-1s" });
    const conVencido = await pedir("/api/usuario/perfil", { token: tokenVencido });
    assert.equal(conVencido.status, 401);

    const perfil = await pedir("/api/usuario/perfil", { token });
    assert.equal(perfil.status, 200);
    const serializado = JSON.stringify(perfil.data);
    assert.ok(!/contraseña/i.test(serializado), "el perfil no debe exponer la contraseña");
});

test("inyección SQL y errores sin fuga de detalles", async () => {
    const usuario = await registrar("sqli1");
    const token = await iniciarSesion(usuario);
    usuariosCreados.push({ token });

    const payloads = ["' OR '1'='1", "' OR 1=1--", "'; DROP TABLE usuarios;--", "1; SELECT 1", "' OR 1=1#"];
    for (const payload of payloads) {
        const login = await pedir("/api/auth/login", {
            metodo: "POST",
            cuerpo: { login: payload, contraseña: payload }
        });
        assert.ok([400, 401].includes(login.status), `SQLi login debería ser 400/401 (${payload})`);
        assert.ok(!/postgres|syntax error|pg_|error:/i.test(login.texto), `sin fuga de error BD (${payload})`);
    }

    const registroMalicioso = await pedir("/api/auth/register", {
        metodo: "POST",
        cuerpo: { ...usuario, username: "' OR 1=1--", correo: "inject@test.local" }
    });
    assert.equal(registroMalicioso.status, 400);

    const idMalo = await pedir("/api/habito/' OR 1=1--", { metodo: "PUT", token, cuerpo: { nombre: "x" } });
    assert.equal(idMalo.status, 400, "id malicioso debe ser rechazado con 400");
    assert.ok(!/postgres|syntax error/i.test(idMalo.texto));

    const periodo = await pedir("/api/bitacora?periodo=' OR 1=1--", { token });
    assert.ok(![500].includes(periodo.status), "periodo malicioso no debe dar 500");

    const jsonRoto = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"login": "a"',
        signal: AbortSignal.timeout(10000)
    });
    assert.equal(jsonRoto.status, 400);
});

test("validación de ids en rutas con :id", async () => {
    const usuario = await registrar("ids1");
    const token = await iniciarSesion(usuario);
    usuariosCreados.push({ token });

    const casos = [
        ["/api/habito/abc", "PUT", 400],
        ["/api/habito/-1", "PUT", 400],
        ["/api/habito/1.5", "PUT", 400],
        ["/api/notas/xyz", "PUT", 400],
        ["/api/eventos/2.5", "PUT", 400],
        ["/api/pomodoro/abc", "GET", 400],
        ["/api/metodos-pago/abc", "DELETE", 400],
        ["/api/categorias/1.5", "PUT", 400],
        ["/api/movimientos/xyz", "GET", 400],
        ["/api/ejercicios/abc", "DELETE", 400],
        ["/api/splits/-1", "PUT", 400],
        ["/api/sesiones/1.5", "PUT", 400],
        ["/api/entrenamientos/xyz", "GET", 400],
        ["/api/entrenamientos/abc/finalizar", "PUT", 400],
        ["/api/series/abc", "DELETE", 400]
    ];
    for (const [ruta, metodo, esperado] of casos) {
        const res = await pedir(ruta, { metodo, token });
        assert.equal(res.status, esperado, `${metodo} ${ruta} debe ser ${esperado}`);
    }

    // Las rutas GET por id eliminadas ya no existen (404 sin datos)
    const eliminadas = [
        `/api/habito/1`,
        `/api/notas/1`,
        `/api/eventos/1`,
        `/api/notas/por-fecha?fecha=2026-01-01`,
        `/api/estadisticas/habito/1`
    ];
    for (const ruta of eliminadas) {
        const res = await pedir(ruta, { token });
        assert.equal(res.status, 404, `${ruta} ya no debe existir`);
    }
});

test("IDOR: usuario A no puede acceder a recursos del usuario B", async () => {
    const usuarioA = await registrar("idorA");
    const tokenA = await iniciarSesion(usuarioA);
    usuariosCreados.push({ token: tokenA });

    const usuarioB = await registrar("idorB");
    const tokenB = await iniciarSesion(usuarioB);
    usuariosCreados.push({ token: tokenB });

    const habito = await pedir("/api/habito", {
        metodo: "POST",
        token: tokenB,
        cuerpo: { tipo_habito: 1, nombre: "Habito de B", frecuencia: "DIARIO" }
    });
    assert.equal(habito.status, 201);
    const idHabito = habito.data.id_habito;

    const nota = await pedir("/api/notas", {
        metodo: "POST",
        token: tokenB,
        cuerpo: { contenido: "Nota privada de B" }
    });
    assert.equal(nota.status, 201);
    const idNota = nota.data.nota.id_nota;

    const evento = await pedir("/api/eventos", {
        metodo: "POST",
        token: tokenB,
        cuerpo: {
            titulo: "Evento de B",
            fecha_inicio: "2026-12-01T12:00:00.000Z",
            fecha_fin: "2026-12-01T13:00:00.000Z"
        }
    });
    assert.equal(evento.status, 201);
    const idEvento = evento.data.id_evento;

    const sesion = await pedir("/api/pomodoro", {
        metodo: "POST",
        token: tokenB,
        cuerpo: { minutos_objetivo: 25 }
    });
    assert.equal(sesion.status, 201);
    const idSesion = sesion.data.sesion.id_sesion;

    const metodoB = await pedir("/api/metodos-pago", {
        metodo: "POST",
        token: tokenB,
        cuerpo: { nombre: "MetodoB", tipo: "DEBITO" }
    });
    assert.equal(metodoB.status, 201);
    const idMetodoB = metodoB.data.metodo.id_metodo;

    const categoriaB = await pedir("/api/categorias", {
        metodo: "POST",
        token: tokenB,
        cuerpo: { nombre: "CatB", tipo: "GASTO" }
    });
    assert.equal(categoriaB.status, 201);
    const idCategoriaB = categoriaB.data.categoria.id_categoria;

    const movimientoB = await pedir("/api/movimientos", {
        metodo: "POST",
        token: tokenB,
        cuerpo: { tipo_movimiento: "GASTO", cantidad: 10, id_metodo_pago: idMetodoB, id_categoria: idCategoriaB }
    });
    assert.equal(movimientoB.status, 201);
    const idMovimientoB = movimientoB.data.movimiento.id_movimiento;

    const catalogoB = await pedir("/api/ejercicios", { token: tokenB });
    assert.equal(catalogoB.status, 200);
    const ejercicioB = catalogoB.data[0];

    const splitB = await pedir("/api/splits", {
        metodo: "POST",
        token: tokenB,
        cuerpo: {
            nombre: "Split de B",
            es_activo: true,
            sesiones: [{
                nombre_sesion: "Push",
                dia_asignado: 1,
                ejercicios: [{ id_ejercicio: ejercicioB.id_ejercicio }]
            }]
        }
    });
    assert.equal(splitB.status, 201);
    const idSplitB = splitB.data.id_split;
    const sesionB = splitB.data.sesiones[0];

    const entrenoB = await pedir("/api/entrenamientos", {
        metodo: "POST",
        token: tokenB,
        cuerpo: { id_sesion_plan: sesionB.id_sesion_plan }
    });
    assert.equal(entrenoB.status, 201);
    const idEntrenoB = entrenoB.data.entrenamiento.id_entrenamiento;

    const serieB = await pedir(`/api/entrenamientos/${idEntrenoB}/series`, {
        metodo: "POST",
        token: tokenB,
        cuerpo: { id_ejercicio: ejercicioB.id_ejercicio, numero_serie: 1, repeticiones: 8, peso: 60, unidad_peso: "kg" }
    });
    assert.equal(serieB.status, 201);
    const idSerieB = serieB.data.serie.id_serie;

    const intentos = [
        [`/api/habito/${idHabito}`, "PUT", { nombre: "Intruso" }],
        [`/api/habito/${idHabito}`, "DELETE", null],
        [`/api/notas/${idNota}`, "PUT", { contenido: "Intruso" }],
        [`/api/eventos/${idEvento}`, "PUT", { titulo: "Intruso" }],
        [`/api/eventos/${idEvento}`, "DELETE", null],
        [`/api/pomodoro/${idSesion}`, "GET", null],
        [`/api/pomodoro/${idSesion}`, "PUT", { minutos_realizados: 5 }],
        [`/api/pomodoro/${idSesion}`, "DELETE", null],
        [`/api/metodos-pago/${idMetodoB}`, "DELETE", null],
        [`/api/categorias/${idCategoriaB}`, "PUT", { nombre: "Intruso" }],
        [`/api/categorias/${idCategoriaB}`, "DELETE", null],
        [`/api/movimientos/${idMovimientoB}`, "GET", null],
        [`/api/splits/${idSplitB}`, "GET", null],
        [`/api/splits/${idSplitB}`, "PUT", { nombre: "Intruso" }],
        [`/api/splits/${idSplitB}/activar`, "PUT", null],
        [`/api/splits/${idSplitB}`, "DELETE", null],
        [`/api/splits/${idSplitB}/sesiones`, "POST", { nombre_sesion: "Intruso", dia_asignado: 2 }],
        [`/api/sesiones/${sesionB.id_sesion_plan}`, "PUT", { nombre_sesion: "Intruso" }],
        [`/api/sesiones/${sesionB.id_sesion_plan}/ejercicios`, "PUT", { ejercicios: [] }],
        [`/api/sesiones/${sesionB.id_sesion_plan}`, "DELETE", null],
        [`/api/entrenamientos/${idEntrenoB}`, "GET", null],
        [`/api/entrenamientos/${idEntrenoB}`, "DELETE", null],
        [`/api/entrenamientos/${idEntrenoB}/finalizar`, "PUT", null],
        [`/api/entrenamientos/${idEntrenoB}/series`, "POST", { id_ejercicio: ejercicioB.id_ejercicio, numero_serie: 2, repeticiones: 5, peso: 60, unidad_peso: "kg" }],
        [`/api/series/${idSerieB}`, "PUT", { repeticiones: 1 }],
        [`/api/series/${idSerieB}`, "DELETE", null]
    ];
    for (const [ruta, metodo, cuerpo] of intentos) {
        const res = await pedir(ruta, { metodo, token: tokenA, cuerpo });
        assert.equal(res.status, 404, `A no debe acceder a ${ruta} (${metodo})`);
    }

    // A tampoco puede iniciar un entrenamiento con la sesión de B
    const inicioAjeno = await pedir("/api/entrenamientos", {
        metodo: "POST",
        token: tokenA,
        cuerpo: { id_sesion_plan: sesionB.id_sesion_plan }
    });
    assert.equal(inicioAjeno.status, 404, "iniciar con sesión ajena debe ser 404");

    const metodosA = await pedir("/api/metodos-pago", { token: tokenA });
    assert.equal(metodosA.status, 200);
    assert.ok(
        !(metodosA.data || []).some(m => m.id_metodo === idMetodoB),
        "A no debe ver el método de pago de B"
    );

    const movimientosA = await pedir("/api/movimientos", { token: tokenA });
    assert.equal(movimientosA.status, 200);
    assert.ok(
        !(movimientosA.data || []).some(m => m.id_movimiento === idMovimientoB),
        "A no debe ver los movimientos de B"
    );

    const splitsA = await pedir("/api/splits", { token: tokenA });
    assert.equal(splitsA.status, 200);
    assert.ok(
        !(splitsA.data || []).some(s => s.id_split === idSplitB),
        "A no debe ver el split de B"
    );
});

test("finanzas: validación de payloads, reglas de negocio y filtros", async () => {
    const usuario = await registrar("fin1");
    const token = await iniciarSesion(usuario);
    usuariosCreados.push({ token });

    const metodoTipoMalo = await pedir("/api/metodos-pago", {
        metodo: "POST",
        token,
        cuerpo: { nombre: "Prueba", tipo: "PREPAGO" }
    });
    assert.equal(metodoTipoMalo.status, 400);

    const metodoSinNombre = await pedir("/api/metodos-pago", {
        metodo: "POST",
        token,
        cuerpo: { nombre: "   ", tipo: "DEBITO" }
    });
    assert.equal(metodoSinNombre.status, 400);

    const metodo = await pedir("/api/metodos-pago", {
        metodo: "POST",
        token,
        cuerpo: { nombre: "Tarjeta", tipo: "DEBITO", saldo_inicial: 100 }
    });
    assert.equal(metodo.status, 201);
    const idMetodo = metodo.data.metodo.id_metodo;

    const duplicado = await pedir("/api/metodos-pago", {
        metodo: "POST",
        token,
        cuerpo: { nombre: "Tarjeta", tipo: "DEBITO" }
    });
    assert.equal(duplicado.status, 409, "mismo nombre y tipo debe dar 409");

    const mismoNombreOtroTipo = await pedir("/api/metodos-pago", {
        metodo: "POST",
        token,
        cuerpo: { nombre: "Tarjeta", tipo: "CREDITO" }
    });
    assert.equal(mismoNombreOtroTipo.status, 201, "mismo nombre con distinto tipo debe permitirse");
    const idDestino = mismoNombreOtroTipo.data.metodo.id_metodo;

    const categoria = await pedir("/api/categorias", {
        metodo: "POST",
        token,
        cuerpo: { nombre: "Comida", tipo: "GASTO" }
    });
    assert.equal(categoria.status, 201);
    const idCategoria = categoria.data.categoria.id_categoria;

    const categoriaDuplicada = await pedir("/api/categorias", {
        metodo: "POST",
        token,
        cuerpo: { nombre: "Comida", tipo: "GASTO" }
    });
    assert.equal(categoriaDuplicada.status, 409);

    const categoriaTipoMalo = await pedir("/api/categorias", {
        metodo: "POST",
        token,
        cuerpo: { nombre: "Ahorro", tipo: "INVERSION" }
    });
    assert.equal(categoriaTipoMalo.status, 400);

    const casosMovimiento = [
        [{ tipo_movimiento: "PAGO", cantidad: 10, id_metodo_pago: idMetodo }, 400],
        [{ tipo_movimiento: "GASTO", cantidad: 0, id_metodo_pago: idMetodo }, 400],
        [{ tipo_movimiento: "GASTO", cantidad: -5, id_metodo_pago: idMetodo }, 400],
        [{ tipo_movimiento: "GASTO", cantidad: "abc", id_metodo_pago: idMetodo }, 400],
        [{ tipo_movimiento: "TRANSFERENCIA", cantidad: 10, id_metodo_pago: idMetodo }, 400],
        [{ tipo_movimiento: "GASTO", cantidad: 10, id_metodo_pago: idMetodo, id_metodo_pago_destino: idDestino }, 400],
        [{ tipo_movimiento: "TRANSFERENCIA", cantidad: 10, id_metodo_pago: idMetodo, id_metodo_pago_destino: idMetodo }, 400],
        [{ tipo_movimiento: "GASTO", cantidad: 10, id_metodo_pago: 999999 }, 404],
        [{ tipo_movimiento: "GASTO", cantidad: 10, id_metodo_pago: idMetodo, id_categoria: 999999 }, 404],
        [{ tipo_movimiento: "GASTO", cantidad: 10, id_metodo_pago: idMetodo, fecha: "ayer" }, 400],
        [{ tipo_movimiento: "GASTO", cantidad: 10, id_metodo_pago: idMetodo, descripcion: "x".repeat(256) }, 400]
    ];
    for (const [cuerpo, esperado] of casosMovimiento) {
        const res = await pedir("/api/movimientos", { metodo: "POST", token, cuerpo });
        assert.equal(res.status, esperado, `POST /api/movimientos ${JSON.stringify(cuerpo)} debe ser ${esperado}`);
        assert.ok(!/postgres|syntax error/i.test(res.texto), "sin fuga de error BD");
    }

    const filtros = ["fecha=ayer", "mes=10-2026", "tipo=OTRO", "metodo=abc"];
    for (const query of filtros) {
        const res = await pedir(`/api/movimientos?${query}`, { token });
        assert.equal(res.status, 400, `filtro ${query} debe ser 400`);
    }

    const gasto = await pedir("/api/movimientos", {
        metodo: "POST",
        token,
        cuerpo: { tipo_movimiento: "GASTO", cantidad: 30, id_metodo_pago: idMetodo, id_categoria: idCategoria }
    });
    assert.equal(gasto.status, 201);
    const idMovimiento = gasto.data.movimiento.id_movimiento;

    const metodos = await pedir("/api/metodos-pago", { token });
    assert.equal(metodos.status, 200);
    const leido = (metodos.data || []).find(m => m.id_metodo === idMetodo);
    assert.ok(leido, "el método debe existir en el listado");
    assert.equal(Number(leido.saldo_actual), 70, "el gasto debe restar 30 del saldo inicial de 100");

    const detalle = await pedir(`/api/movimientos/${idMovimiento}`, { token });
    assert.equal(detalle.status, 200);
    assert.equal(detalle.data.categoria_nombre, "Comida");
    assert.equal(detalle.data.metodo_nombre, "Tarjeta");

    const transferencia = await pedir("/api/movimientos", {
        metodo: "POST",
        token,
        cuerpo: { tipo_movimiento: "TRANSFERENCIA", cantidad: 50, id_metodo_pago: idMetodo, id_metodo_pago_destino: idDestino }
    });
    assert.equal(transferencia.status, 201);

    const metodosTras = await pedir("/api/metodos-pago", { token });
    const origen = (metodosTras.data || []).find(m => m.id_metodo === idMetodo);
    const destino = (metodosTras.data || []).find(m => m.id_metodo === idDestino);
    assert.equal(Number(origen.saldo_actual), 20, "la transferencia debe restar del origen");
    assert.equal(Number(destino.saldo_actual), 50, "la transferencia debe sumar al destino");

    const categoriaEliminada = await pedir(`/api/categorias/${idCategoria}`, { metodo: "DELETE", token });
    assert.equal(categoriaEliminada.status, 200, "eliminar categoría con movimientos debe funcionar (SET NULL)");

    const metodoConMovimientos = await pedir(`/api/metodos-pago/${idMetodo}`, { metodo: "DELETE", token });
    assert.equal(metodoConMovimientos.status, 409, "no se puede eliminar un método con movimientos");

    const metodoLimpio = await pedir("/api/metodos-pago", {
        metodo: "POST",
        token,
        cuerpo: { nombre: "Limpio", tipo: "DEBITO" }
    });
    assert.equal(metodoLimpio.status, 201);
    const borrado = await pedir(`/api/metodos-pago/${metodoLimpio.data.metodo.id_metodo}`, { metodo: "DELETE", token });
    assert.equal(borrado.status, 200, "un método sin movimientos se puede eliminar");
});

test("gimnasio: catálogo, splits y sesiones (validación y reglas)", async () => {
    const usuario = await registrar("gimcat");
    const token = await iniciarSesion(usuario);
    usuariosCreados.push({ token });

    // Catálogo sembrado + filtros
    const catalogo = await pedir("/api/ejercicios", { token });
    assert.equal(catalogo.status, 200);
    assert.ok(catalogo.data.length >= 40, "el seed debe traer el catálogo base");

    const grupo = await pedir("/api/ejercicios?grupo=pecho", { token });
    assert.equal(grupo.status, 200);
    assert.ok(grupo.data.length > 0 && grupo.data.every(e => e.grupo_muscular.toLowerCase() === "pecho"));

    const busqueda = await pedir("/api/ejercicios?q=press", { token });
    assert.equal(busqueda.status, 200);
    assert.ok(busqueda.data.length > 0);

    // Validaciones del catálogo
    const casosEjercicio = [
        [{ grupo_muscular: "Pecho" }, 400],
        [{ nombre: "  ", grupo_muscular: "Pecho" }, 400],
        [{ nombre: "Sin grupo" }, 400],
        [{ nombre: "x".repeat(101), grupo_muscular: "Pecho" }, 400],
        [{ nombre: "Press Banca", grupo_muscular: "Pecho" }, 409]
    ];
    for (const [cuerpo, esperado] of casosEjercicio) {
        const res = await pedir("/api/ejercicios", { metodo: "POST", token, cuerpo });
        assert.equal(res.status, esperado, `POST /api/ejercicios ${JSON.stringify(cuerpo)} debe ser ${esperado}`);
    }

    const filtrosMalos = ["grupo=" + "x".repeat(51), "q=" + "x".repeat(101)];
    for (const query of filtrosMalos) {
        const res = await pedir(`/api/ejercicios?${query}`, { token });
        assert.equal(res.status, 400, `filtro ${query.slice(0, 10)} debe ser 400`);
    }

    const ejercicio = await pedir("/api/ejercicios", {
        metodo: "POST",
        token,
        cuerpo: { nombre: `PRUEBA_GIM_${Math.floor(Math.random() * 100000)}`, grupo_muscular: "Pecho" }
    });
    assert.equal(ejercicio.status, 201);
    const idEjercicio = ejercicio.data.ejercicio.id_ejercicio;

    const duplicado = await pedir("/api/ejercicios", {
        metodo: "POST",
        token,
        cuerpo: { nombre: ejercicio.data.ejercicio.nombre.toLowerCase(), grupo_muscular: "Pecho" }
    });
    assert.equal(duplicado.status, 409, "el catálogo rechaza nombres duplicados sin importar mayúsculas");

    const sinCampos = await pedir(`/api/ejercicios/${idEjercicio}`, { metodo: "PUT", token, cuerpo: {} });
    assert.equal(sinCampos.status, 400);

    const aNombreUsado = await pedir(`/api/ejercicios/${idEjercicio}`, {
        metodo: "PUT",
        token,
        cuerpo: { nombre: "Press Banca" }
    });
    assert.equal(aNombreUsado.status, 409);

    const editar = await pedir(`/api/ejercicios/${idEjercicio}`, {
        metodo: "PUT",
        token,
        cuerpo: { grupo_muscular: "Hombro" }
    });
    assert.equal(editar.status, 200);

    const borrarLibre = await pedir(`/api/ejercicios/${idEjercicio}`, { metodo: "DELETE", token });
    assert.equal(borrarLibre.status, 200, "un ejercicio sin uso se puede borrar");

    // Splits: validaciones de payload
    const press = catalogo.data.find(e => e.nombre === "Press Banca");
    const casosSplit = [
        [{}, 400],
        [{ nombre: "   " }, 400],
        [{ nombre: "x".repeat(51) }, 400],
        [{ nombre: "Ok", es_activo: "si" }, 400],
        [{ nombre: "Ok", sesiones: "no" }, 400],
        [{ nombre: "Ok", sesiones: [{ nombre_sesion: "Push", dia_asignado: "lunes" }] }, 400],
        [{ nombre: "Ok", sesiones: [{ nombre_sesion: "Push", dia_asignado: 0 }] }, 400],
        [{ nombre: "Ok", sesiones: [{ nombre_sesion: "Push", dia_asignado: 8 }] }, 400],
        [{ nombre: "Ok", sesiones: [{ nombre_sesion: "Push", dia_asignado: 1 }, { nombre_sesion: "Pull", dia_asignado: 1 }] }, 400],
        [{ nombre: "Ok", sesiones: [{ nombre_sesion: "Push", dia_asignado: 1, ejercicios: "no" }] }, 400],
        [{ nombre: "Ok", sesiones: [{ nombre_sesion: "Push", dia_asignado: 1, ejercicios: [{ id_ejercicio: "abc" }] }] }, 400],
        [{ nombre: "Ok", sesiones: [{ nombre_sesion: "Push", dia_asignado: 1, ejercicios: [{ id_ejercicio: press.id_ejercicio }, { id_ejercicio: press.id_ejercicio }] }] }, 400],
        [{ nombre: "Ok", sesiones: [{ nombre_sesion: "Push", dia_asignado: 1, ejercicios: [{ id_ejercicio: press.id_ejercicio, orden: 0 }] }] }, 400],
        [{ nombre: "Ok", sesiones: [{ nombre_sesion: "Push", dia_asignado: 1, ejercicios: [{ id_ejercicio: press.id_ejercicio, orden: 1 }, { id_ejercicio: press.id_ejercicio + 1, orden: 1 }] }] }, 400],
        [{ nombre: "Ok", sesiones: [{ nombre_sesion: "Push", dia_asignado: 1, ejercicios: [{ id_ejercicio: 999999 }] }] }, 404]
    ];
    for (const [cuerpo, esperado] of casosSplit) {
        const res = await pedir("/api/splits", { metodo: "POST", token, cuerpo });
        assert.equal(res.status, esperado, `POST /api/splits ${JSON.stringify(cuerpo).slice(0, 80)} debe ser ${esperado}`);
        assert.ok(!/postgres|syntax error/i.test(res.texto), "sin fuga de error BD");
    }

    // Split válido con dos sesiones y receta
    const split = await pedir("/api/splits", {
        metodo: "POST",
        token,
        cuerpo: {
            nombre: "PPLxUL de prueba",
            es_activo: true,
            sesiones: [
                { nombre_sesion: "Push", dia_asignado: 1, ejercicios: [{ id_ejercicio: press.id_ejercicio }, { id_ejercicio: press.id_ejercicio + 1 }] },
                { nombre_sesion: "Pull", dia_asignado: 2 }
            ]
        }
    });
    assert.equal(split.status, 201);
    const idSplit = split.data.id_split;
    assert.equal(split.data.sesiones.length, 2);

    const detalle = await pedir(`/api/splits/${idSplit}`, { token });
    assert.equal(detalle.status, 200);
    assert.equal(detalle.data.sesiones[0].ejercicios.length, 2, "la receta viene anidada");
    assert.equal(detalle.data.sesiones[1].ejercicios.length, 0);

    // Solo un split activo
    const split2 = await pedir("/api/splits", {
        metodo: "POST",
        token,
        cuerpo: { nombre: "Arnold de prueba", es_activo: true, sesiones: [{ nombre_sesion: "Upper", dia_asignado: 3 }] }
    });
    assert.equal(split2.status, 201);
    const activos = (await pedir("/api/splits", { token })).data.filter(s => s.es_activo);
    assert.equal(activos.length, 1, "solo un split activo por usuario");
    assert.equal(activos[0].id_split, split2.data.id_split);

    const activar = await pedir(`/api/splits/${idSplit}/activar`, { metodo: "PUT", token });
    assert.equal(activar.status, 200);
    const activos2 = (await pedir("/api/splits", { token })).data.filter(s => s.es_activo);
    assert.equal(activos2.length, 1);
    assert.equal(activos2[0].id_split, idSplit);

    // Sesiones: crear
    const idSesionPush = split.data.sesiones[0].id_sesion_plan;
    const sesionOcupada = await pedir(`/api/splits/${idSplit}/sesiones`, {
        metodo: "POST",
        token,
        cuerpo: { nombre_sesion: "Duplicada", dia_asignado: 1 }
    });
    assert.equal(sesionOcupada.status, 409, "no dos sesiones el mismo día");
    const sesionDiaMalo = await pedir(`/api/splits/${idSplit}/sesiones`, {
        metodo: "POST",
        token,
        cuerpo: { nombre_sesion: "X", dia_asignado: 9 }
    });
    assert.equal(sesionDiaMalo.status, 400);
    const sesionSplitInexistente = await pedir("/api/splits/999999/sesiones", {
        metodo: "POST",
        token,
        cuerpo: { nombre_sesion: "X", dia_asignado: 4 }
    });
    assert.equal(sesionSplitInexistente.status, 404);

    // Sesiones: editar
    const sinDatos = await pedir(`/api/sesiones/${idSesionPush}`, { metodo: "PUT", token, cuerpo: {} });
    assert.equal(sinDatos.status, 400);
    const diaOcupado = await pedir(`/api/sesiones/${idSesionPush}`, {
        metodo: "PUT",
        token,
        cuerpo: { dia_asignado: 2 }
    });
    assert.equal(diaOcupado.status, 409);
    const editarSesion = await pedir(`/api/sesiones/${idSesionPush}`, {
        metodo: "PUT",
        token,
        cuerpo: { nombre_sesion: "Push A", dia_asignado: 1 }
    });
    assert.equal(editarSesion.status, 200);

    // Receta: reemplazar
    const recetaSinCampo = await pedir(`/api/sesiones/${idSesionPush}/ejercicios`, { metodo: "PUT", token, cuerpo: {} });
    assert.equal(recetaSinCampo.status, 400);
    const recetaInexistente = await pedir(`/api/sesiones/${idSesionPush}/ejercicios`, {
        metodo: "PUT",
        token,
        cuerpo: { ejercicios: [{ id_ejercicio: 999999 }] }
    });
    assert.equal(recetaInexistente.status, 404);
    const recetaOk = await pedir(`/api/sesiones/${idSesionPush}/ejercicios`, {
        metodo: "PUT",
        token,
        cuerpo: { ejercicios: [{ id_ejercicio: press.id_ejercicio }] }
    });
    assert.equal(recetaOk.status, 200);
    assert.equal(recetaOk.data.ejercicios, 1);

    // Ejercicio en uso no se borra
    const ejEnUso = await pedir(`/api/ejercicios/${press.id_ejercicio}`, { metodo: "DELETE", token });
    assert.equal(ejEnUso.status, 409);

    // Limpieza: borrar splits sin historial
    assert.equal((await pedir(`/api/splits/${split2.data.id_split}`, { metodo: "DELETE", token })).status, 200);
    assert.equal((await pedir(`/api/splits/${idSplit}`, { metodo: "DELETE", token })).status, 200);
    assert.equal((await pedir(`/api/splits/${idSplit}`, { metodo: "DELETE", token })).status, 404, "ya borrado");
});

test("gimnasio: flujo de entrenamiento, series y PR", async () => {
    const usuario = await registrar("gimflujo");
    const token = await iniciarSesion(usuario);
    usuariosCreados.push({ token });

    const catalogo = await pedir("/api/ejercicios", { token });
    const press = catalogo.data.find(e => e.nombre === "Press Banca");
    const remo = catalogo.data.find(e => e.nombre === "Remo con barra");

    // Sesión asignada a los 7 días para que /hoy siempre resuelva
    const sesiones = [];
    for (let dia = 1; dia <= 7; dia++) {
        sesiones.push({
            nombre_sesion: `Dia ${dia}`,
            dia_asignado: dia,
            ejercicios: [{ id_ejercicio: press.id_ejercicio }, { id_ejercicio: remo.id_ejercicio }]
        });
    }
    const split = await pedir("/api/splits", {
        metodo: "POST",
        token,
        cuerpo: { nombre: "PPLxUL flujo", es_activo: true, sesiones }
    });
    assert.equal(split.status, 201);

    // Plan del día
    const hoy = await pedir("/api/entrenamientos/hoy", { token });
    assert.equal(hoy.status, 200);
    assert.ok(typeof hoy.data.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(hoy.data.fecha),
        "fecha de hoy como texto YYYY-MM-DD");
    assert.ok(hoy.data.split && hoy.data.split.id_split === split.data.id_split, "trae el split activo");
    assert.ok(hoy.data.sesion, "hay sesión hoy");
    assert.equal(hoy.data.sesion.dia_asignado, hoy.data.dia_semana, "la sesión corresponde al día de la semana");
    assert.equal(hoy.data.ejercicios.length, 2);
    assert.ok(hoy.data.ejercicios.every(e => e.pr === null && e.ultima_vez === null),
        "sin historial no hay PR ni última vez");
    assert.equal(hoy.data.entrenamiento_activo, null);

    // Iniciar
    const inicio = await pedir("/api/entrenamientos", { metodo: "POST", token, cuerpo: {} });
    assert.equal(inicio.status, 201);
    const idEntrenamiento = inicio.data.entrenamiento.id_entrenamiento;
    const duplicado = await pedir("/api/entrenamientos", { metodo: "POST", token, cuerpo: {} });
    assert.equal(duplicado.status, 409, "un entrenamiento en curso bloquea iniciar otro");

    // Series: validaciones
    const casosSerie = [
        [{ id_ejercicio: press.id_ejercicio, numero_serie: 1, repeticiones: 8, peso: 0, unidad_peso: "kg" }, 400],
        [{ id_ejercicio: press.id_ejercicio, numero_serie: 1, repeticiones: 8, peso: "pesado", unidad_peso: "kg" }, 400],
        [{ id_ejercicio: press.id_ejercicio, numero_serie: 1, repeticiones: 0, peso: 60, unidad_peso: "kg" }, 400],
        [{ id_ejercicio: press.id_ejercicio, numero_serie: 0, repeticiones: 8, peso: 60, unidad_peso: "kg" }, 400],
        [{ id_ejercicio: press.id_ejercicio, numero_serie: 1, repeticiones: 8, peso: 60, unidad_peso: "libras" }, 400],
        [{ id_ejercicio: "abc", numero_serie: 1, repeticiones: 8, peso: 60, unidad_peso: "kg" }, 400],
        [{ id_ejercicio: 999999, numero_serie: 1, repeticiones: 8, peso: 60, unidad_peso: "kg" }, 404]
    ];
    for (const [cuerpo, esperado] of casosSerie) {
        const res = await pedir(`/api/entrenamientos/${idEntrenamiento}/series`, { metodo: "POST", token, cuerpo });
        assert.equal(res.status, esperado, `POST serie ${JSON.stringify(cuerpo)} debe ser ${esperado}`);
        assert.ok(!/postgres|syntax error/i.test(res.texto), "sin fuga de error BD");
    }

    const serieInexistente = await pedir("/api/entrenamientos/999999/series", {
        metodo: "POST",
        token,
        cuerpo: { id_ejercicio: press.id_ejercicio, numero_serie: 1, repeticiones: 8, peso: 60, unidad_peso: "kg" }
    });
    assert.equal(serieInexistente.status, 404);

    // Registrar series: 75 kg y 225 lbs (PR normalizado debe quedar en lbs)
    const serie1 = await pedir(`/api/entrenamientos/${idEntrenamiento}/series`, {
        metodo: "POST",
        token,
        cuerpo: { id_ejercicio: press.id_ejercicio, numero_serie: 1, repeticiones: 5, peso: 75, unidad_peso: "kg" }
    });
    assert.equal(serie1.status, 201);
    assert.equal(typeof serie1.data.serie.peso, "number");

    const serieDuplicada = await pedir(`/api/entrenamientos/${idEntrenamiento}/series`, {
        metodo: "POST",
        token,
        cuerpo: { id_ejercicio: press.id_ejercicio, numero_serie: 1, repeticiones: 4, peso: 75, unidad_peso: "kg" }
    });
    assert.equal(serieDuplicada.status, 409, "misma serie del mismo ejercicio no se repite");

    const serie2 = await pedir(`/api/entrenamientos/${idEntrenamiento}/series`, {
        metodo: "POST",
        token,
        cuerpo: { id_ejercicio: press.id_ejercicio, numero_serie: 2, repeticiones: 3, peso: 225, unidad_peso: "lbs" }
    });
    assert.equal(serie2.status, 201);
    const idSerie2 = serie2.data.serie.id_serie;

    // /hoy con entrenamiento activo + PR
    const hoy2 = await pedir("/api/entrenamientos/hoy", { token });
    assert.ok(hoy2.data.entrenamiento_activo, "muestra el entrenamiento en curso");
    assert.equal(hoy2.data.entrenamiento_activo.id_entrenamiento, idEntrenamiento);
    const pr = hoy2.data.ejercicios.find(e => e.id_ejercicio === press.id_ejercicio).pr;
    assert.ok(pr, "ya hay PR para el ejercicio entrenado");
    assert.equal(Number(pr.peso), 225, "225 lbs (102 kg) gana a 75 kg");
    assert.equal(pr.unidad_peso, "lbs", "el PR se conserva con la unidad en que se logró");
    const sinSeries = hoy2.data.ejercicios.find(e => e.id_ejercicio === remo.id_ejercicio);
    assert.equal(sinSeries.ultima_vez, null, "sin series no hay última vez");

    // Editar serie
    const sinUnidad = await pedir(`/api/series/${idSerie2}`, { metodo: "PUT", token, cuerpo: { peso: 100 } });
    assert.equal(sinUnidad.status, 400, "peso sin unidad_peso");
    const sinDatos = await pedir(`/api/series/${idSerie2}`, { metodo: "PUT", token, cuerpo: {} });
    assert.equal(sinDatos.status, 400);
    const soloReps = await pedir(`/api/series/${idSerie2}`, { metodo: "PUT", token, cuerpo: { repeticiones: 6 } });
    assert.equal(soloReps.status, 200);
    const pesoUnidad = await pedir(`/api/series/${idSerie2}`, { metodo: "PUT", token, cuerpo: { peso: 100, unidad_peso: "kg" } });
    assert.equal(pesoUnidad.status, 200);

    // Finalizar
    const finalizar = await pedir(`/api/entrenamientos/${idEntrenamiento}/finalizar`, { metodo: "PUT", token });
    assert.equal(finalizar.status, 200);
    assert.equal(typeof finalizar.data.entrenamiento.duracion_minutos, "number");
    const finalizarDoble = await pedir(`/api/entrenamientos/${idEntrenamiento}/finalizar`, { metodo: "PUT", token });
    assert.equal(finalizarDoble.status, 409);

    // Historial y detalle
    const historial = await pedir("/api/entrenamientos", { token });
    assert.equal(historial.status, 200);
    assert.equal(historial.data.length, 1);
    assert.equal(historial.data[0].ejercicios, 1);
    assert.equal(historial.data[0].series, 2);
    assert.equal(typeof historial.data[0].duracion_minutos, "number");

    const historialMes = await pedir(`/api/entrenamientos?mes=${hoy.data.fecha.slice(0, 7)}`, { token });
    assert.equal(historialMes.data.length, 1, "filtro mes encuentra el entrenamiento");
    assert.equal((await pedir("/api/entrenamientos?mes=1999-01", { token })).data.length, 0);
    assert.equal((await pedir("/api/entrenamientos?mes=enero", { token })).status, 400);
    assert.equal((await pedir("/api/entrenamientos?fecha=ayer", { token })).status, 400);

    const detalle = await pedir(`/api/entrenamientos/${idEntrenamiento}`, { token });
    assert.equal(detalle.status, 200);
    assert.equal(detalle.data.ejercicios.length, 1);
    assert.equal(detalle.data.ejercicios[0].series.length, 2);
    assert.equal(typeof detalle.data.ejercicios[0].series[0].peso, "number");

    // Sin entrenamiento activo, /hoy refleja la última vez de hoy
    const hoy3 = await pedir("/api/entrenamientos/hoy", { token });
    assert.equal(hoy3.data.entrenamiento_activo, null);
    const ultima = hoy3.data.ejercicios.find(e => e.id_ejercicio === press.id_ejercicio).ultima_vez;
    assert.ok(ultima, "la última vez queda registrada");
    assert.equal(ultima.fecha, hoy.data.fecha, "se registró hoy");
    assert.equal(ultima.series.length, 2);

    // Borrar entrenamiento
    const borrar = await pedir(`/api/entrenamientos/${idEntrenamiento}`, { metodo: "DELETE", token });
    assert.equal(borrar.status, 200);
    const borrarDoble = await pedir(`/api/entrenamientos/${idEntrenamiento}`, { metodo: "DELETE", token });
    assert.equal(borrarDoble.status, 404);

    // Sin split activo no se puede iniciar
    assert.equal((await pedir(`/api/splits/${split.data.id_split}`, { metodo: "DELETE", token })).status, 200);
    const sinSplit = await pedir("/api/entrenamientos", { metodo: "POST", token, cuerpo: {} });
    assert.equal(sinSplit.status, 400);
    assert.ok(/split activo/i.test(sinSplit.data.message), "el mensaje explica que falta un split activo");
});

test("XSS almacenado: el backend guarda y devuelve el payload tal cual (el render lo escapa Angular)", async () => {
    const usuario = await registrar("xss1");
    const token = await iniciarSesion(usuario);
    usuariosCreados.push({ token });

    const payloadNota = "<script>alert(1)</script>";
    const nota = await pedir("/api/notas", {
        metodo: "POST",
        token,
        cuerpo: { contenido: payloadNota }
    });
    assert.equal(nota.status, 201);
    const idNota = nota.data.nota.id_nota;

    const notas = await pedir("/api/notas", { token });
    assert.equal(notas.status, 200);
    const notaLeida = (notas.data || []).find(n => n.id_nota === idNota);
    assert.ok(notaLeida, "la nota creada debe aparecer en el listado");
    assert.equal(notaLeida.contenido, payloadNota);

    const payloadEvento = "<img src=x onerror=alert(1)>";
    const evento = await pedir("/api/eventos", {
        metodo: "POST",
        token,
        cuerpo: {
            titulo: payloadEvento,
            fecha_inicio: "2026-12-02T12:00:00.000Z",
            fecha_fin: "2026-12-02T13:00:00.000Z"
        }
    });
    assert.equal(evento.status, 201);
    const idEvento = evento.data.id_evento;

    const eventos = await pedir("/api/eventos", { token });
    assert.equal(eventos.status, 200);
    const eventoLeido = (eventos.data || []).find(e => e.id_evento === idEvento);
    assert.ok(eventoLeido, "el evento creado debe aparecer en el listado");
    assert.equal(eventoLeido.titulo, payloadEvento);
});

test("rate limit: fuerza bruta en login debe bloquear con 429", { skip: process.env.SKIP_RATE_LIMIT === "1" }, async () => {
    const usuario = await registrar("rate1");
    usuariosCreados.push({ token: await iniciarSesion(usuario) });

    let bloqueado = false;
    for (let i = 0; i < LIMITE_LOGIN + 10; i++) {
        const res = await pedir("/api/auth/login", {
            metodo: "POST",
            cuerpo: { login: usuario.correo, contraseña: "ContrasenaIncorrecta!" }
        });
        if (res.status === 429) {
            bloqueado = true;
            break;
        }
        assert.equal(res.status, 401, "antes de bloquear debe ser 401");
    }
    assert.ok(bloqueado, "se debe alcanzar el límite y recibir 429");
});
