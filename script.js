let preguntas = [];
let seleccionadas = [];
let preguntaActual = 0;
let respuestasCorrectas = 0;
let tiempoRestante = 3 * 60 * 60;
let temporizadorInterval;
let tiempoInicioExamen = 0;
let historialRespuestas = [];
let archivoPreguntas = "preguntas.json"; // valor por defecto

// Cargar preguntas desde JSON
async function cargarPreguntas(archivo) {
    try {
        const res = await fetch(archivo);
        preguntas = await res.json();

        const total = preguntas.length;
        console.log(total)
    } catch (error) {
        console.log("ERROR AL CARGAR LAS PREGUNTAS")
    }
    //document.getElementById("infoPreguntas").textContent = `Total de preguntas: ${total}`
}

function iniciarExamen() {
    // Seleccionamos hasta 80 preguntas únicas
    const preguntasUnicas = Array.from(new Set(preguntas.map(p => JSON.stringify(p)))).map(p => JSON.parse(p));
    seleccionadas = preguntasUnicas.sort(() => Math.random() - 0.5).slice(0, Math.min(80, preguntasUnicas.length));

    preguntaActual = 0;
    respuestasCorrectas = 0;
    tiempoRestante = 3 * 60 * 60;
    tiempoInicioExamen = Date.now();

    document.getElementById("inicio").classList.add("d-none");
    document.getElementById("final").classList.add("d-none");
    document.getElementById("examen").classList.remove("d-none");

    mostrarPregunta();
    iniciarTemporizador();
}

function iniciarTemporizador() {
    clearInterval(temporizadorInterval);
    temporizadorInterval = setInterval(() => {
        tiempoRestante--;
        const h = String(Math.floor(tiempoRestante / 3600)).padStart(2, '0');
        const m = String(Math.floor((tiempoRestante % 3600) / 60)).padStart(2, '0');
        const s = String(tiempoRestante % 60).padStart(2, '0');
        document.getElementById("temporizador").textContent = `${h}:${m}:${s}`;

        if (tiempoRestante <= 0) finalizarExamen();
    }, 1000);
}

function mostrarPregunta() {
    const p = seleccionadas[preguntaActual];
    document.getElementById("progreso").textContent = `Pregunta ${preguntaActual + 1} de ${seleccionadas.length}`;
    document.getElementById("preguntaTexto").textContent = p.pregunta;

    const opcionesDiv = document.getElementById("opciones");
    opcionesDiv.innerHTML = '';

    p.opciones.forEach((opcion, i) => {
        const tipoInput = p.tipo === 'multiple' ? 'checkbox' : 'radio';
        opcionesDiv.innerHTML += `
            <div class="form-check">
                <input class="form-check-input" type="${tipoInput}" name="opcion" value="${i}" id="op${i}">
                <label class="form-check-label" for="op${i}">${opcion}</label>
            </div>
        `;
    });

    document.getElementById("feedback").textContent = '';
    document.getElementById("btnEnviar").disabled = false;
    document.getElementById("btnSiguiente").disabled = true;
}

function enviarRespuesta() {
    const p = seleccionadas[preguntaActual];
    const seleccionados = Array.from(document.querySelectorAll('input[name="opcion"]:checked')).map(el => parseInt(el.value));
    const esCorrecto = JSON.stringify(seleccionados.sort()) === JSON.stringify(p.respuestas_correctas.sort());

    if (esCorrecto) {
        respuestasCorrectas++;
        document.getElementById("feedback").innerHTML = '<span class="text-success">✅ Correcto</span>';
    } else {
        const correctas = p.respuestas_correctas
            .map(i => p.opciones[i])
            .map(r => `• ${r}`)
            .join('<br>');
        document.getElementById("feedback").innerHTML = `
            <span class="text-danger">❌ Incorrecto</span> 
            <br>Respuesta(s) correcta(s):<br>
            ${correctas}
        `;
    }

    // 🔹 Guardar historial
    historialRespuestas.push({
        pregunta: p.pregunta,
        opciones: p.opciones,
        seleccionados: seleccionados,
        correctas: p.respuestas_correctas,
        esCorrecto: esCorrecto
    });

    document.getElementById("btnEnviar").disabled = true;
    document.getElementById("btnSiguiente").disabled = false;
}


function siguientePregunta() {
    preguntaActual++;
    if (preguntaActual < seleccionadas.length) {
        mostrarPregunta();
    } else {
        finalizarExamen();
    }
}

function finalizarExamen() {
    clearInterval(temporizadorInterval);
    document.getElementById("examen").classList.add("d-none");
    document.getElementById("final").classList.remove("d-none");

    const tiempoTotalSeg = Math.floor((Date.now() - tiempoInicioExamen) / 1000);
    const minutos = Math.floor(tiempoTotalSeg / 60);
    const segundos = tiempoTotalSeg % 60;

    const preguntasRespondidas = preguntaActual + 1;
    const porcentaje = ((respuestasCorrectas / preguntasRespondidas) * 100).toFixed(2);

    // Resumen global
    document.getElementById("resultadoFinal").innerHTML = `
        Tiempo total: ${minutos} min ${segundos} seg<br>
        Preguntas respondidas: ${preguntasRespondidas}<br>
        Porcentaje de aciertos: ${porcentaje}%
    `;

    // Feedback detallado
    let feedbackHTML = `<h4 class="mt-4">Detalle de Respuestas</h4>`;
    historialRespuestas.forEach((item, idx) => {
    feedbackHTML += `<div class="mb-3"><strong>Pregunta ${idx + 1}:</strong> ${item.pregunta}<br><br>`;


    feedbackHTML += `<ul class="list-unstyled">`;
    item.opciones.forEach((opcion, i) => {
        let icono = "<span style='visibility:hidden'>⬜</span>";

        if (item.seleccionados.includes(i)) {
            if (item.correctas.includes(i)) {
                icono = "✅"; // seleccionada y correcta
            } else {
                icono = "❌"; // seleccionada e incorrecta
            }
        } else if (item.correctas.includes(i)) {
            icono = "☑️"; // correcta pero no seleccionada
        } 

        feedbackHTML += `<li>${icono} ${opcion}</li>`;
    });
    feedbackHTML += `</ul>`;


    feedbackHTML += `</div><hr>`;
    });

    document.getElementById("feedbackFinal").innerHTML = feedbackHTML;
}


function reiniciarExamen() {
    historialRespuestas = []; // limpiar historial
    document.getElementById("final").classList.add("d-none");
    document.getElementById("inicio").classList.remove("d-none");
}



// Eventos
document.getElementById("btnPractica").addEventListener("click", async () => {
    archivoPreguntas = "preguntas.json";
    await cargarPreguntas(archivoPreguntas);
    iniciarExamen();
});

document.getElementById("btnExamen").addEventListener("click", async () => {
    archivoPreguntas = "preguntas_examen.json";
    await cargarPreguntas(archivoPreguntas);
    iniciarExamen();
});


document.getElementById("btnEnviar").addEventListener("click", enviarRespuesta);
document.getElementById("btnSiguiente").addEventListener("click", siguientePregunta);
document.getElementById("btnFinalizar").addEventListener("click", finalizarExamen);
document.getElementById("btnReiniciar").addEventListener("click", reiniciarExamen);

cargarPreguntas();
