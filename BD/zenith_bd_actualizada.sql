--
-- PostgreSQL database dump
--

\restrict tKCot9rhLocCFkEqy2DtUcWL19CM2UQH1NMFhThM8dViNyVBnOIASCsWJvDHqKc

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: estado_frecuencia; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.estado_frecuencia AS ENUM (
    'DIARIO',
    'SEMANAL',
    'MENSUAL'
);


ALTER TYPE public.estado_frecuencia OWNER TO postgres;

--
-- Name: estado_usuario; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.estado_usuario AS ENUM (
    'ACTIVO',
    'INACTIVO'
);


ALTER TYPE public.estado_usuario OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: actividades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actividades (
    id_actividad integer NOT NULL,
    usuario integer NOT NULL,
    fecha_asignada timestamp without time zone NOT NULL,
    titulo character varying(100) NOT NULL,
    descripcion character varying(255),
    tiempo_estimado integer NOT NULL,
    recordatorio timestamp without time zone NOT NULL
);


ALTER TABLE public.actividades OWNER TO postgres;

--
-- Name: actividades_id_actividad_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.actividades ALTER COLUMN id_actividad ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.actividades_id_actividad_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: habitos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.habitos (
    id_habito integer NOT NULL,
    tipo_habito integer NOT NULL,
    usuario integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion character varying(255),
    frecuencia public.estado_frecuencia DEFAULT 'DIARIO'::public.estado_frecuencia NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    estado public.estado_usuario DEFAULT 'ACTIVO'::public.estado_usuario NOT NULL,
    meta numeric(10,2),
    unidad character varying(50)
);


ALTER TABLE public.habitos OWNER TO postgres;

--
-- Name: habitos_id_habito_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.habitos ALTER COLUMN id_habito ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.habitos_id_habito_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: notas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notas (
    id_nota integer NOT NULL,
    usuario integer NOT NULL,
    fecha_creacion date NOT NULL,
    nota character varying(255) NOT NULL
);


ALTER TABLE public.notas OWNER TO postgres;

--
-- Name: notas_id_nota_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.notas ALTER COLUMN id_nota ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.notas_id_nota_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: registro_habitos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registro_habitos (
    id_registro_habito integer NOT NULL,
    habito integer NOT NULL,
    fecha timestamp without time zone,
    estado character(1),
    fecha_programada date,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    valor_realizado numeric(10,2)
);


ALTER TABLE public.registro_habitos OWNER TO postgres;

--
-- Name: registro_habitos_id_registro_habito_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.registro_habitos ALTER COLUMN id_registro_habito ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.registro_habitos_id_registro_habito_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sesiones_habito; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sesiones_habito (
    id_sesion integer NOT NULL,
    habito integer NOT NULL,
    fecha_inicio timestamp without time zone NOT NULL,
    fecha_fin timestamp without time zone NOT NULL,
    duracion_minutos integer NOT NULL
);


ALTER TABLE public.sesiones_habito OWNER TO postgres;

--
-- Name: sesiones_habito_id_sesion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.sesiones_habito ALTER COLUMN id_sesion ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.sesiones_habito_id_sesion_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tipos_habitos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tipos_habitos (
    id_tipo_habito integer NOT NULL,
    nombre character varying(20)
);


ALTER TABLE public.tipos_habitos OWNER TO postgres;

--
-- Name: tipos_habitos_id_tipo_habito_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.tipos_habitos ALTER COLUMN id_tipo_habito ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tipos_habitos_id_tipo_habito_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id_usuario integer NOT NULL,
    nombre character varying(30) NOT NULL,
    primer_apellido character varying(30) NOT NULL,
    segundo_apellido character varying(30),
    correo character varying(100) NOT NULL,
    telefono character varying(10) NOT NULL,
    foto_perfil character varying(100),
    fecha_nacimiento date,
    estado character(1) NOT NULL,
    "contraseña" character varying(255) NOT NULL,
    username character varying(50) NOT NULL
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.usuarios ALTER COLUMN id_usuario ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.usuarios_id_usuario_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: actividades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.actividades (id_actividad, usuario, fecha_asignada, titulo, descripcion, tiempo_estimado, recordatorio) FROM stdin;
\.


--
-- Data for Name: habitos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.habitos (id_habito, tipo_habito, usuario, nombre, descripcion, frecuencia, fecha_creacion, estado, meta, unidad) FROM stdin;
\.


--
-- Data for Name: notas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notas (id_nota, usuario, fecha_creacion, nota) FROM stdin;
\.


--
-- Data for Name: registro_habitos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.registro_habitos (id_registro_habito, habito, fecha, estado, fecha_programada, fecha_registro, valor_realizado) FROM stdin;
\.


--
-- Data for Name: sesiones_habito; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sesiones_habito (id_sesion, habito, fecha_inicio, fecha_fin, duracion_minutos) FROM stdin;
\.


--
-- Data for Name: tipos_habitos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tipos_habitos (id_tipo_habito, nombre) FROM stdin;
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id_usuario, nombre, primer_apellido, segundo_apellido, correo, telefono, foto_perfil, fecha_nacimiento, estado, "contraseña", username) FROM stdin;
\.


--
-- Name: actividades_id_actividad_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.actividades_id_actividad_seq', 1, false);


--
-- Name: habitos_id_habito_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.habitos_id_habito_seq', 1, false);


--
-- Name: notas_id_nota_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notas_id_nota_seq', 1, false);


--
-- Name: registro_habitos_id_registro_habito_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.registro_habitos_id_registro_habito_seq', 1, false);


--
-- Name: sesiones_habito_id_sesion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sesiones_habito_id_sesion_seq', 1, false);


--
-- Name: tipos_habitos_id_tipo_habito_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipos_habitos_id_tipo_habito_seq', 1, false);


--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_usuario_seq', 1, false);


--
-- Name: actividades actividades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT actividades_pkey PRIMARY KEY (id_actividad);


--
-- Name: habitos habitos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habitos
    ADD CONSTRAINT habitos_pkey PRIMARY KEY (id_habito);


--
-- Name: notas notas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notas
    ADD CONSTRAINT notas_pkey PRIMARY KEY (id_nota);


--
-- Name: registro_habitos registro_habitos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registro_habitos
    ADD CONSTRAINT registro_habitos_pkey PRIMARY KEY (id_registro_habito);


--
-- Name: sesiones_habito sesiones_habito_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesiones_habito
    ADD CONSTRAINT sesiones_habito_pkey PRIMARY KEY (id_sesion);


--
-- Name: tipos_habitos tipos_habitos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_habitos
    ADD CONSTRAINT tipos_habitos_pkey PRIMARY KEY (id_tipo_habito);


--
-- Name: usuarios usuarios_correo_unico; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_correo_unico UNIQUE (correo);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);


--
-- Name: usuarios usuarios_telefono_unico; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_telefono_unico UNIQUE (telefono);


--
-- Name: usuarios usuarios_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key UNIQUE (username);


--
-- Name: actividades fk_actividad_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT fk_actividad_usuario FOREIGN KEY (usuario) REFERENCES public.usuarios(id_usuario);


--
-- Name: habitos fk_habito_tipo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habitos
    ADD CONSTRAINT fk_habito_tipo FOREIGN KEY (tipo_habito) REFERENCES public.tipos_habitos(id_tipo_habito);


--
-- Name: habitos fk_habito_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habitos
    ADD CONSTRAINT fk_habito_usuario FOREIGN KEY (usuario) REFERENCES public.usuarios(id_usuario);


--
-- Name: notas fk_notas_usuarios; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notas
    ADD CONSTRAINT fk_notas_usuarios FOREIGN KEY (usuario) REFERENCES public.usuarios(id_usuario);


--
-- Name: registro_habitos fk_registro_habito; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registro_habitos
    ADD CONSTRAINT fk_registro_habito FOREIGN KEY (habito) REFERENCES public.habitos(id_habito);


--
-- Name: sesiones_habito fk_sesiones_habitos; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesiones_habito
    ADD CONSTRAINT fk_sesiones_habitos FOREIGN KEY (habito) REFERENCES public.habitos(id_habito);


--
-- PostgreSQL database dump complete
--

\unrestrict tKCot9rhLocCFkEqy2DtUcWL19CM2UQH1NMFhThM8dViNyVBnOIASCsWJvDHqKc

