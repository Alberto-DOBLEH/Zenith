# Pantallas
## Principal
Referencia: [[Ideas por modulo#Habitos]]
Pues la estructura consistiria de un [[#Header]] mientras que en el lado izquierdo seria un [[#Sidebar]], en cuanto a la estructura del contendor principal, lo idea seria que lo primero que vea el usuario serian sus habitos, como una lista, dividida en dos:
Habitos buenos | Habitos malos

En todo caso los habitos serian asi:
Nombre del habito
Descripcion
Objetivo(solo en el caso de tiempo y repeticiones)
Racha del habito en ese momento
Y aqui ya hay 3 tipos de cosas que renderizar
1. SI el habito es normal o evitados se pondria un checkbox unicamente
2. SI el habito es de tiempo se renderizaria un boton que abra el pomodoro
3. Si el habito es de repeticiones se mostraria el contador con un boton para sumar del lado izquierdo
Los habitos negativos/evitados pues es lo mismo solo que seria en la otra seccion.
Estas tarjetas de los habitos permitiran al usuario darles click y que te muestre el modal de [[#Detalles de habito]].

Una vez que el habito haya sido marcado como completado se tiene que ver de manera grafica que ya se completo, oscureciendolo, tachandolo, 

En el caso de que no exista ningun habito mostraria un boton que diga "crear un habito", y este te mande a la pantalla [[#Habitos]] con el modal [[#Creacion de habitos]] ya abierto.

Luego al lado de esa lista pondria una seccion de eventos proximos, donde se mostrarian los eventos que se tienen mas cerca, siendo nomas una tarjetita de con el nombre del evento, hora y fecha de este mismo. Cuando el usuario le de click a esta seccion completa lo mandaria a la pantalla de [[#Eventos]]^nota2

Luego por debajo de esto estarian algunas graficas de los habitos y rachas del usuario en base a los datos que se han tenido.
Graficas mostradas:
- Grafica de linea por habitos completados en la semana. siendo el eje horizontal los dias, y el eje vertical el porcentaje de habitos hechos en el dia(siendo que se hace el calculo de acuerdo al total de habitos hecho por dia sobre la cantidad de habitos totales del usuario multiplicado por 100, por el momento los habitos negativos no se van a tomar en cuenta).
-  Grafico por el progreso mensual del usuario(no se me ocurre que tipo de grafico puede ser).
## Habitos
Referencia: [[Ideas por modulo#Habitos]]
Esta es una de las pantallas mas importantes ya que es el punto de la aplicacion, tendrias una lista de todos los habitos que tienes guardados, algo asi como el de la pantalla principal, pero en este cada "renglon"  que es un habito tendria dos botones en lugar de los tipicos checkbox, el del pomodoro, o el de sumar, el primer boton seria el de editar que te abriria el modal de [[#Edicion de habito]], el siguiente boton diria eliminar el habito que te abriria el modal de [[#Confirmacion de eliminacion de habito]].

En general seria como una lista donde estarian los habitos, en la parte de arriba de esa lista(contenedor), estaria la opcion para crear uno nuevo, junto con el total de habitos que tienes, en cuanto a la lista yo le pondria en cada uno, una borde derecho de un color dependiendo de si es bueno o malo, siendo esto asi: 
- bueno
	- normal
	- tiempo
	- repeticion
- malo
	- evitado

## Notas
Referencia: [[Ideas por modulo#Notas]]
Esta pantalla tiene como objetivo recopilar las notas del usuario, para mantener los pensamientos en un solo lugar, lo primero que se miraria en esta pantalla son dos casos:
- Caso 1: En el caso de que no se haya creado una nota del dia aun, te saldria un boton que diria crear la nota del dia, una ves presionado cambiara a un campo de texto para que se empieze la nota del dia.
- Caso 2: Ya se empezo una nota del dia, en este caso es sencillo nomas mostraria el campo ya generado del paso anterior, claro con el texto que se escribio, solo que estaria bloqueado y abajo saldria un boton que diria seguir escribiendo una vez presionado ya dejaria escribir en el campo de texto
Ya con esa parte hecha, al lado saldria un contenedor que tendria el historico de las notas, ya que la idea de eso, es que se puedan ver las notas de dias anteriores, para que ocuparias hacer notas si no las puedes ver?, entonces, lo que se haria es ir con el scroll por las tarjetas de las notas que nomas contendrian:
Nota - Fecha dd/mm/yyyy
Pequeño texto del inicio de la nota

Una ves que se le de click, el campo de texto que estaba de la nota del dia, cambiaria al texto que se recupero de esa nota especifica, no saldria como modal, y en la esquina tendria el tipico boton de X para cerrarla, una ves cerrada esa nota se devolveria a la nota del dia, en el caso de que se abran varias notas seguidas, lo que se va hacer es que se cierre la que se abrio antes y se va reemplazar por la nueva basicamente asi:

Orden de clicks:
Nota del dia -> Nota del dia 09/08/2026 -> Nota del dia 05/08/2026 -> Le da a cerrar
Acciones:
1. Se abre la nota del 09/08/26
2. Se cierra esa nota
3. Se abre la nota del 05/08/26
4. Se cierra la nota
5. Se muestra la nota del dia actual

## Eventos
Referencia: [[Ideas por modulo#Eventos]]
Esta es la pantalla de eventos, la cual es una medianamente importantes es mas un agregado que puede servir de mucho, pero la idea es que lo primero que vea el usuario es un contenedor con una semitabla que sea por eje horizontal los dias de la semana actual, y en el eje vertical serian las horas, por ejemplo:
Usamos el dia de hoy 11/08/2026, es martes, en el eje horizontal empezaria con 09/08/26  y terminaria en 15/08/26, pero el dia de hoy se marcaria para resaltarlo, no mucho pero que si se pueda notar. Entonces se mostarian los bloques por hora en cuanto a la verticalidad de las columnas, por cierto, este se podria mover para ver las siguientes semanas, y pues tambien devolver para ver los eventos anteriores

Bueno con eso explicado, arriba de eso, se mostraria un boton de creacion de evento que te abrira el modal de [[#Creacion de eventos]], ya que en el calendario semanal, se van a mostrar por bloques los eventos que hay, por colores y horas, por ejemplo si yo tuviera un evento de 3 horas este viernes 14/08/29 y empieza  a las 14:00:00, me tendria que marcar en el color elejido en el calendario, un bloque de ese color con el puro nombre, pero ese recuadro tiene que agarrar los bloques desde las 14:00:00 a las 17:00:00, ya que pues dura 3 horas el evento, ya ese mismo bloque permitiria interactuar con el, para ver los detalles del evento con el modal de [[#Detalles de evento]]

Y al lado derecho del calendario, se miraria la lista de los eventos, ordenados por lo mas proximos en adelante, eventos que ya pasaron pues no es como que interesen mucho, algo asi como la lista que esta en la [[#^nota2]]. Solo que sin el comportamiento que tiene.
## Pomodoro
Referencia: [[Ideas por modulo#Pomodoro]]
Esta es una de las funciones principales que tiene la app, que basicamente es un pomodoro, solo que este es el externo, el que el usuario puede usar sin estart totalmente ligado a un habito, pues un simple pomodoro, el unico campo editable seria donde el usuario pondria el tiempo de la sesion, para que el sistema haga el calculo de los ciclos que se van a ocupar para cubrir ese tiempo.
## Perfil
Referencia: [[Ideas por modulo#Perfil]]
En este caso es solo una ventana de perfil donde se miraria la foto de perfil y la informacion completa del usuario, estaria separada por tarjetas la primera seria la informacion de usuario compuesta por:
- Nombres
- Apellidos
- username
- Fecha de nacimiento
- Pais
Con un boton en la esquina inferior derecha que diga para cambiar los datos y te abra el modal de [[#Edicion de datos de usuario]]
La segunda tarjeta seria la de autenticacion:
- Correo
- Numero de telefono
Esta vendria con un boton de la misma manera de cambiar la contraseña y que te abriria el modal de [[#Edicion de contraseña]]
Y la ultima tarjeta seria la de administracion de cuenta que nomas contaria con un boton el cuale seria:
- Eliminar cuenta
Que pues te abriria el modal de [[#Confirmacion de eliminado de cuenta]]

Estoy pensando que el de la foto de perfil sea una tarjeta pero en el lateral, y que hasta abajo donde tope el asunto de las tarjetas, ahi este el boton de cerrar sesion que te abriria el modal de [[#Confirmacion de cerrar sesion]].
# Modales

## Detalles de habito
Este modal solo mostraria los detalles del habito
Los cuales son:
- Nombre
- Descripcion
- Objetivo(En el caso de normal no mostrarlo, en el caso de tiempo las horas/minutos y su unidad, como repeticion, cantidad y unidad, ejemplo: 20 Hojas)
- Bueno/Malo
- Frecuencia(diario/semanal/mensual)
- En el caso de semanal, que dias(Lunes, Martes, Miercoles, Jueves, Viernes, Sabado o Domingo)
## Creacion de habitos
En este se mostrarian campos de texto de cada una de las caracteristicas que se necesitan del habito siendo estos:
- Nombre
- Descripcion
- Tipo habito(en BD es numerico del catalogo, en Front es una lista seleccionable)
- Objetivo(solo en caso de tiempo y repeticion)
- Unidad(solo en caso de tiempo y repeticion)
- Frecuencia
- Dias(si es diario se ponen todos los dias por defecto)
## Edicion de habito
En este se mostraran los mismo campos editables que en el modal [[#Creacion de habitos]]
Solo que ya vendrian cargados.
## Confirmacion de eliminacion de habito
Solo mostraria un si o un no, en el caso de querer eliminar un habito, saldria el nombre del habito y los dos botones, en el caso de el si pues lo borra, en el caso del no, solo se cierra el modal.
## Creacion de eventos
En este modal seria como el modal de habito, solo que los campos serian los respectivos de evento. 
Estos campos serian:
- Nombre del evento
- Descripcion
- Fecha y hora del evento
- Color(Sera un catalogo de ellos)
- Duracion del evento
- Se repite el evento
	- Si. Frecuencia y Dias
	- No. No se despliega nada
- Avisos(Esta sera una lista pero no se guardarian en la tabla eventos)
## Edicion de eventos
Los mismo campos de que el modal [[#Creacion de eventos]], solo que los datos estarian precargados.
## Creacion de avisos

## Detalles de evento

## Pomodoro de habito

## Edicion de datos de usuario

## Edicion de contraseña

## Confirmacion de eliminado de cuenta

## Confirmacion de cerrar sesion


# Compartidos

## Header
Algo sencillo este tendria en el lado izquierdo el logo de la aplicacion junto con el nombre de la app, y en el otro lado el boton del perfil del usuario, para poder llevarlo a la pantalla de [[#Perfil]], este ultimo boton tendra que tener la foto de perfil del usuario o el avatar asignado a la cuenta(basicamente lo mismo, ya que se van a guardar en el mismo campo los dos).

En el modo telefono, este header recibiria una modificacion, y es que en lugar de mostrar el logo en el lado izquierdo, cambiaria por un boton con el logo stack(las 3 rayitas apiladas), para poder abrir el sidebar que siempre va estar oculto.^modotelefono ^nota1
## Sidebar
Algo sencillo este en el modo escritorio estaria siempre presente del lado izquierdo, una de las caracterizticas es que siempre que estemos en una pantalla en el sidebar va estar señalada esta pantalla para que asi sea mas facil saber en donde estamos, este nos llevaria a todas las pantallas del sistema siendo estas las siguientes:
- Pantalla Principal(Esta seria la primera que veria el usuario)
- Habitos
- Notas
- Eventos
- Pomodoro
En el modo de telefono, mostraria un nuevo campo que bajaria las opciones para mostrar el logo y nombre de la app, esta se ocultaria con un boton del header mencionado aqui:[[#^nota1]]