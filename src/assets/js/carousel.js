let slide = null;
var current = 0;
var delay = 5000;
var status_ivo = 0;
let params = new URLSearchParams(document.location.search);
const ivo_id = params.get('id');
var actualizacion = null
var path_url = 'https://ivo.test/api/';

if(params.get('display') == 'test'){
    console.log('--- inicializando en ambiente de pruebas ---');
    path_url = 'https://ivo.test/api/';
}else if(params.get('display') == 'prod'){
    console.log('--- inicializando en ambiente de producción ---');
    path_url = 'https://control.ivo.com.co/api/';
}

function cls(){
    for(let i = 0; i < slide.length; i++){
        slide[i].style.display = 'none';
    }
}

function next(){
    cls();
    if(current === slide.length-1) current = -1;
    current++;

    slide[current].style.display = 'block';
    slide[current].style.opacity = 1;
    var type = slide[current].dataset.type;
    if(type == 'video'){
        var video = document.getElementById(slide[current].dataset.ref)
        video.currentTime = 0;
        video.play();
        setTimeout(() => {
            video.pause();
        }, slide[current].dataset.time - 150);
    }
    if(type == 'streaming'){
        var youtube = document.getElementById(slide[current].dataset.ref);
        postMessageToPlayer(youtube, {
            "event": "command",
            "func": "mute"
        });
        postMessageToPlayer(youtube, {
            "event": "command",
            "func": "playVideo"
        });
        const player = new YT.Player(slide[current].dataset.ref, {
            events: {
                "onReady": event => {
                    let timeDelay = (player.getDuration() * 1000) - 500;
                    setTimeout(() => {
                        postMessageToPlayer(youtube, {
                            "event": "command",
                            "func": "pauseVideo"
                        });
                        player.stopVideo();
                    }, timeDelay);
                },
            }
        });
    }
    interval(slide[current].dataset.time);
}

function start(){
    ping_status();
    get_files();
}
start();

function interval(val, type, ref){
    var startDelay = setInterval(function(){
        next();
        clearInterval(startDelay);
    }, val);
}

function ping_status(){
    let statusDiv = document.getElementById('status_point');
    var url = path_url + 'status';
    $.ajax({
        type: "get",
        url: url,
        success: function(response){
            statusDiv.children[0].className = 'status_span bg-success';
            status_ivo = 1;
        },
        error: function(error){
            statusDiv.children[0].className = 'status_span bg-danger';
            status_ivo = 0;
        }
    });
}

function checkForUpdates(){
    ping_status();
    var url = path_url + 'consultar-actualizacion';
    $.ajax({
        type: "post",
        url: url,
        data: {
            ivo: ivo_id,
            fecha: actualizacion
        },
        success: function(response){
            if(response.actualizar === true) window.location.reload();
        },
        error: function(error){
            console.log(error);
        }
    });
};

function get_files(){
    console.log(ivo_id);
    var url = path_url + 'totem-files/' + ivo_id;
    $.ajax({
        type: "get",
        url: url,
        success: function(response){
            const files = response.archivos;
            actualizacion = response.actualizacion;
            var data_container = document.getElementById('ivo_carousel');
            files.forEach((element) => {
                const tipo = element.tipo;
                const frame = document.createElement("div");
                if(tipo == 'image'){
                    frame.innerHTML = `
                        <div class="slide-img" id="${element.id}">
                            <img class="fill" src="${element.src}">
                        </div>
                    `;
                    frame.classList.add("slide");
                    data_container.appendChild(frame);
                }
                if(tipo == 'video'){
                    frame.innerHTML = `
                        <video id="${element.id}" class="slide-video" video autoplay muted>
                            <source id="mp4" src="${element.src}" type="video/mp4">
                        </video>
                    `;
                    frame.classList.add("slide");
                    data_container.appendChild(frame);
                }
                if(tipo == 'streaming'){
                    frame.innerHTML = `
                        <iframe id="${element.id}" width="100%" height="100%" src="${element.src}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    `;
                    frame.classList.add("slide");
                    data_container.appendChild(frame);
                }
                frame.setAttribute('data-time', element.duracion);
                frame.setAttribute('data-ref', element.id);
                frame.setAttribute('data-type', element.tipo);
            });
            status_ivo = 1;
            slide = document.querySelectorAll('.slide');
            setTimeout(() => {
                interval(files[0].duracion);
            }, 200);
        },
        error: function(error){
            console.log(error);
            status_ivo = 0;
        }
    });
};

function downloadFiles()
{
        
}

var timeOutCheck = setTimeout(setTimeOutCheck, 1000 * 60 * 5);
function setTimeOutCheck() {
    checkForUpdates();
    timeOutCheck = setTimeout(setTimeOutCheck, 1000 * 60 * 5);
}

function postMessageToPlayer(player, command){
    if (player == null || command == null) return;
    player.contentWindow.postMessage(JSON.stringify(command), "*");
}