# Habitos
Descripcion: Esta es la idea principal del proyecto, esto siendo lo escencial, lo que tiene que estar completamente planteado, por lo que aqui van algunas caracteristicas de esto:
- Se dividen en 4 tipos, normal, por tiempo, por repeteciones y evitados
	- Normal: Solo se hace una vez al dia(Tiene que responder la pregunta de ¿Se hizo o no?)
	- Tiempo: Se tiene que hacer cierto tiempo al dia por medio de la cantidad de ciclos pomodoro.(Tiene que responder la preguntar ¿Cuanto tiempo lo tengo que hacer?)
		- En la tarjeta de este tipo de habito, se mostraria un boton para que se abra el pomodoro.
		- El sistema se encargaria de calcular la cantidad de ciclos que se ocupan de acuerdo con el tiempo asignado por el usuario
		- Se permitira al usuario asignar por minutos y horas, cualquiera de los dos.
		- El habito se marcaria como completado unicamente cuando se completen los ciclos del pomodoro.
		- Se puede marcar como terminado en cualquier momento, pero no completado, en esos casos se marcaria como parcial/en progreso.
	- Repeticiones: Se tiene que cumplir con una cierta cantidad de repeticiones o unidades de ese habito.(Tiene que responder la pregunta ¿Cuantas veces tengo que hacerlo?)
		- Estos habitos pueden permitir al usuario asignar unidades diferentes(Ejemplo: Leer un libro Objetivo: 10 Paginas).
		- En la propia tarjeta de visualizacion de los habitos de este tipo tendria que salir un formato para ir sumando, pero no restando.
		- El habito se marcaria como completado solo cuando se llega al objetivo definido.
	- Evitados: Funcionan a la inversa de un habito normal solo registraria la recaida(Tiene que responder la pregunta ¿Lo hize de nuevo?)
		- Estos pues como se dijo que funcionan a la inversa, solo se marcaria el checkbox cuando se recaiga en este habito(Ejemplo: Fumar ¿Lo hize de nuevo?)
- El listado de estos tiene que salir en la pagina principal
- Se tiene que llevar racha de cada uno de los habitos y de los dias en los que se cumplieron con todos los habitos.
- Se guardan en un bitacora/historial para poder siempre consultar para temas estadisticos y graficos.
- En caso de los habitos normales, tiempo y repeticion son por decirlo buenos, estos tienen 3 estados diferentes(no los usan todos cada uno).
	- Completado
		- Este lo usan todos, en el normal, es cuando se marca el checkbox respectivo del habito, en tiempo es cuando se completan los ciclos de pomodoro, se le asignara esto automaticamente, y en el caso de repeticiones se marca una vez llega al numero objetivo. cualquiera de los 3 que este marcado con este al final del dia sumaria racha del habito
	- Parcial/En progreso/Sin terminar
		- Este se usa en tiempo y repeticiones, en el caso de tiempo cuando se empieza los ciclos pomodoro se le asigna automaticamente, si se termina/cancela el pomodoro se queda en este estado, si se terminan los ciclos se le cambia a complemtado, en el caso de repeticion, se le asigna en cuanto el numero de repeticiones sea mayor a 0, y se cambia automaticamente a completado cuando se completan las repeticiones, si no se terminan las repeticiones en el transcurso del dia y llega la media noche se queda en este estado para las estadisticas 
	- No completado
		- Este lo usan todos, cada los habitos empiezan en este estado base, cuando aun no estan completados o empezados, sino se hacen en el dia se manda este estado al sistema.
- El caso del tipo de evitados es diferentes, siendo el inverso de normal, ya que lo unico que se busca registrar son las recaidas.
	- Evitado
		- Este es el estado base de estos, basicamente con el checkbox sin marcar, si al final del dia este estado no es alterado, se sumaria a la racha de evitar el habito malo
	- Recaida
		- Este seria el estado de cuando se marca el checkbox, y pues te reiniciaria toda la racha de ese habito a evitar, y en este caso te mostraria algo para motivarte.
# Notas
Descripcion: Esta seria algo como un lugar donde guardar los pensamientos de la persona por dia
- Estas son opcionales, no es obligatorio escribir todos los dias
- Estas podrian estar en un pequeño apartado de la pagina principal donde se podria acceder rapido a ellas, de esa manera agilizando todo
- Solo te dejaria editar la nota del dia, una vez que ya no sea del mismo dia, no te dejara editarla y se ira al historial de notas.
- Las notas tendrian su propio apartado donde se podran checar todas de las notas.
# Eventos
Descripcion: El usuario podra guardar eventos/actividades para poder organizarse mejor con los tiempos, esto facilitando el orden y pues es un buen habito hacer esto.
- Los eventos se podran registrar, nombre, descripcion, color, y poner avisos para recordar al usuarios
- Los recordatorios puede ponerlos personalizados, puede poner mas de uno si lo ocupa(Ejemplo: Evento. Examen Lenguajes Fecha y Hora: 16/09/2026 14:00:00 Avisos: 11/09/2026 12:00:00 y 16/09/2026 10:00:00).
- El color lo recibe mas que nada para poder mostrarlo en un calendario semanal que estaria por bloques para mejor visualizacion de los eventos.
- El bloque del evento te abrira la informacion general del evento.
- El calendario mostrara toda la semana separado por dias en el eje horizontal, y en el eje vertical sera por horas.
# Pomodoro
Descripcion: Este es para facilitar al usuario el tema de los tiempos de los habitos del estilo de tiempo, pero tambien lo podra usar externamente para que no este totalmente ligado al habito en concreto(El usuario no tiene un habito de estudiar cierto tiempo, pero sabe que tiene que estudiar por ejemplo 2 horas, pero no es todos los dias, tiene la opcion de poner el evento para tenerlo en cuenta ese tiempo, y cuando llegue ese momento solo usa el pomodoro externo, solo ingresa cuanto tiempo de sesion seria y el sistema calcularia los ciclos).
- En el caso de los habitos pues se abriria automaticamente al acceder al habito y pues generaria los ciclos de acuerdo al tiempo del habito.
- En el caso externo, solo se ingresaria el tiempo de la sesion
- Como el metodo pomodoro, funcionaria por ciclos de 25 de trabajo y 5 o 10 minutos de descanso, para asi poder maximizar la eficiencia del cerebro.
# Perfil
Descripcion: Pues como en todos lados al usuario le gusta poder personalizar las cosas como le gustan a cada uno.
- Permitir edicion de campos no importantes, como nombre, apellidos, fecha de nacimiento y foto de perfil.
- El cambio de foto de perfil puede ser subiendo una foto desde el dispositivo, o puede ser una del catalgo de avatar que va estar.
- En cuanto al cambio de contraseña se piensa hacer que te mande una confirmacion por SMS o por correo en cualquiera de los dos puede servir.
- El numero de telefono, correo electronico y el username, no se pueden cambiar ya que son las credenciales del usuario, por lo que aparte de que seran unicas por usuario, no seran posible cambiarlas por el momento.