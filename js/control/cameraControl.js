function touchUpdate() {
    //degToRad(degress):Math.PI * degress / 180;
    phi = THREE.Math.degToRad(90 - lat);
    theta = THREE.Math.degToRad(lon);
    //三角函数Math.sin(弧度)
    target.x = 500 * Math.sin(phi) * Math.cos(theta);
    target.y = 500 * Math.cos(phi);
    target.z = 500 * Math.sin(phi) * Math.sin(theta);
    camera.lookAt(target);
    changeSecondSceneCamera(phi, theta);
    render();
}
const changeSecondSceneCamera = (phi, theta) => {
    let x = 100 * Math.sin(phi) * Math.cos(theta);
    let z = 100 * Math.sin(phi) * Math.sin(theta);
    _mesh.position.x = x;
    _mesh.position.z = z;
    _light.position.set(0, 0, 0);
}
function touchStart(e) {
    e.preventDefault();
    startX = e.touches[0].pageX;
    startY = e.touches[0].pageY;
    startLon = lon;
    startLat = lat;
}

function touchMove(e) {
    e.preventDefault();
    lon = (startX - e.touches[0].pageX) * 0.1 + startLon;
    lat = (e.touches[0].pageY - startY) * 0.1 + startLat;
    lat = Math.max(-85, Math.min(lat, 85));
    touchUpdate();
}

function onMouseDown(e){
    e.preventDefault();
    if(e.button == 2){
        onMouseClickMesh(e);
    }
    else { 
        startX = e.pageX;
        startY = e.pageY;
        startLon = lon;
        startLat = lat;
        document.addEventListener('mousemove',onMouseMove,false);
        document.addEventListener('mouseup',onMouseUp,false);
        isClick = true;
    }  
}

function onMouseMove(e){
    if(isClick){
        e.preventDefault();
        lon = (startX - e.pageX) * 0.1 + startLon;
        lat = (e.pageY - startY) * 0.1 + startLat;
        lat = Math.max(-85, Math.min(lat, 85));
    }
    touchUpdate();
}

function onMouseUp(e){
    e.preventDefault();
    isClick = false;
}
