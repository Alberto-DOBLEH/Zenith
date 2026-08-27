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

    const porFecha = await pedir("/api/notas/por-fecha?fecha=' OR 1=1--", { token });
    assert.equal(porFecha.status, 400, "fecha maliciosa debe ser rechazada con 400");
    assert.ok(!/postgres|syntax error/i.test(porFecha.texto));

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
        ["/api/habito/abc", 400],
        ["/api/habito/-1", 400],
        ["/api/habito/1.5", 400],
        ["/api/notas/xyz", 400],
        ["/api/eventos/2.5", 400],
        ["/api/pomodoro/abc", 400],
        ["/api/estadisticas/habito/abc", 400]
    ];
    for (const [ruta, esperado] of casos) {
        const res = await pedir(ruta, { token });
        assert.equal(res.status, esperado, `${ruta} debe ser ${esperado}`);
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

    const intentos = [
        [`/api/habito/${idHabito}`, "GET", null],
        [`/api/habito/${idHabito}`, "PUT", { nombre: "Intruso" }],
        [`/api/habito/${idHabito}`, "DELETE", null],
        [`/api/notas/${idNota}`, "GET", null],
        [`/api/notas/${idNota}`, "PUT", { contenido: "Intruso" }],
        [`/api/eventos/${idEvento}`, "GET", null],
        [`/api/eventos/${idEvento}`, "PUT", { titulo: "Intruso" }],
        [`/api/eventos/${idEvento}`, "DELETE", null],
        [`/api/pomodoro/${idSesion}`, "GET", null],
        [`/api/pomodoro/${idSesion}`, "PUT", { minutos_realizados: 5 }],
        [`/api/pomodoro/${idSesion}`, "DELETE", null],
        [`/api/estadisticas/habito/${idHabito}`, "GET", null]
    ];
    for (const [ruta, metodo, cuerpo] of intentos) {
        const res = await pedir(ruta, { metodo, token: tokenA, cuerpo });
        assert.equal(res.status, 404, `A no debe acceder a ${ruta} (${metodo})`);
    }
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

    const notaLeida = await pedir(`/api/notas/${idNota}`, { token });
    assert.equal(notaLeida.status, 200);
    assert.equal(notaLeida.data.contenido, payloadNota);

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

    const eventoLeido = await pedir(`/api/eventos/${idEvento}`, { token });
    assert.equal(eventoLeido.status, 200);
    assert.equal(eventoLeido.data.titulo, payloadEvento);
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
