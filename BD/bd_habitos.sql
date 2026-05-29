--
-- PostgreSQL database dump
--

\restrict HzlLnwwrYavAlbYpDggk0gkk8hPcjYg1ORBqbzVIlVJVhnQdhZgqaM2e2ukc29r

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-05-29 06:32:40 MST

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 16389)
-- Name: detalles_habitos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalles_habitos (
    id_detalle_habito integer NOT NULL,
    id_habito integer NOT NULL,
    dias character varying NOT NULL,
    horas character varying
);


ALTER TABLE public.detalles_habitos OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16397)
-- Name: habitos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.habitos (
    id_habito integer NOT NULL,
    nombre character varying NOT NULL,
    id_usuario integer NOT NULL,
    tipo_habito integer NOT NULL,
    negpos character(1) NOT NULL
);


ALTER TABLE public.habitos OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16407)
-- Name: tipo_habito; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tipo_habito (
    id_tipo_habito integer NOT NULL,
    nombre character varying NOT NULL
);


ALTER TABLE public.tipo_habito OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16414)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id_usuario integer NOT NULL,
    nombre character varying NOT NULL,
    primer_apellido character varying NOT NULL,
    segundo_apellido character varying,
    numero_telefono character varying NOT NULL,
    correo_electronico character varying NOT NULL,
    "contraseña" character varying NOT NULL
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 4497 (class 0 OID 16389)
-- Dependencies: 219
-- Data for Name: detalles_habitos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalles_habitos (id_detalle_habito, id_habito, dias, horas) FROM stdin;
\.


--
-- TOC entry 4498 (class 0 OID 16397)
-- Dependencies: 220
-- Data for Name: habitos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.habitos (id_habito, nombre, id_usuario, tipo_habito, negpos) FROM stdin;
\.


--
-- TOC entry 4499 (class 0 OID 16407)
-- Dependencies: 221
-- Data for Name: tipo_habito; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tipo_habito (id_tipo_habito, nombre) FROM stdin;
\.


--
-- TOC entry 4500 (class 0 OID 16414)
-- Dependencies: 222
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id_usuario, nombre, primer_apellido, segundo_apellido, numero_telefono, correo_electronico, "contraseña") FROM stdin;
\.


--
-- TOC entry 4338 (class 2606 OID 16426)
-- Name: detalles_habitos detalles_habitos_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_habitos
    ADD CONSTRAINT detalles_habitos_pk PRIMARY KEY (id_detalle_habito);


--
-- TOC entry 4340 (class 2606 OID 16428)
-- Name: habitos habitos_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habitos
    ADD CONSTRAINT habitos_pk PRIMARY KEY (id_habito);


--
-- TOC entry 4342 (class 2606 OID 16430)
-- Name: tipo_habito tipo_habito_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_habito
    ADD CONSTRAINT tipo_habito_pk PRIMARY KEY (id_tipo_habito);


--
-- TOC entry 4344 (class 2606 OID 16432)
-- Name: usuarios usuarios_correo_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_correo_unique UNIQUE (correo_electronico);


--
-- TOC entry 4346 (class 2606 OID 16434)
-- Name: usuarios usuarios_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pk PRIMARY KEY (id_usuario);


--
-- TOC entry 4347 (class 2606 OID 16435)
-- Name: detalles_habitos detalles_habitos_habitos_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_habitos
    ADD CONSTRAINT detalles_habitos_habitos_fk FOREIGN KEY (id_habito) REFERENCES public.habitos(id_habito);


--
-- TOC entry 4348 (class 2606 OID 16440)
-- Name: habitos habitos_tipo_habito_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habitos
    ADD CONSTRAINT habitos_tipo_habito_fk FOREIGN KEY (tipo_habito) REFERENCES public.tipo_habito(id_tipo_habito);


--
-- TOC entry 4349 (class 2606 OID 16445)
-- Name: habitos habitos_usuarios_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habitos
    ADD CONSTRAINT habitos_usuarios_fk FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario);


-- Completed on 2026-05-29 06:32:42 MST

--
-- PostgreSQL database dump complete
--

\unrestrict HzlLnwwrYavAlbYpDggk0gkk8hPcjYg1ORBqbzVIlVJVhnQdhZgqaM2e2ukc29r

