var scene, camera, renderer, mesh, stats;
var lon = -90, //把鼠标在屏幕的横偏移量，作为旋转角度的基准，基础为-90度，
    //相当于相机的方向与x轴成-90度
    lat = 0, //把鼠标在屏幕的纵偏移量，作为旋转角度的基准
    phi = 0, //相机的横平面跟y轴的偏移弧度
    theta = 0, //相机的竖切面到x轴的偏移弧度
    target = new THREE.Vector3(); //相机看向的方向，法向量
var startX, startY, startLon, startLat;
var isClick = false;
var clock = new THREE.Clock();
// 移动相关的变量
var isMove = false;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
// 射线控制
var upRaycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, 1, 1), 0, 10);
var horizontalRaycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 10);
var downRaycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);
// 相机的移动方向、各个的速度、朝向
var dirSpeed = new THREE.Vector3();
var direction = new THREE.Vector3();
var rotation = new THREE.Vector3();

var speed = 50;
var width = window.innerWidth;
var height = window.innerHeight;
console.log(width);
// 自动旋转
function update() {
    lon += 0.1;
    lat = Math.max(-85, Math.min(85, lat));
    phi = THREE.Math.degToRad(90 - lat); //角度转为弧度
    theta = THREE.Math.degToRad(lon);
    target.x = 500 * Math.sin(phi) * Math.cos(theta);
    target.y = 500 * Math.cos(phi);
    target.z = 500 * Math.sin(phi) * Math.sin(theta);
    camera.lookAt(target);
    render();
}
// 加载纹理
function loadTexture(url) {
    let texture = new THREE.TextureLoader().load(url);
    texture.needsUpdate = true;
    texture.wrapS = THREE.MirroredRepeatWrapping;
    texture.wrapT = THREE.MirroredRepeatWrapping;
    //texture.repeat = new THREE.Vector2(10,10);
    let material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide
    });
    return material;
}
function initStats(){
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    document.body.appendChild(stats.dom);
}
// 初始化渲染器
function initRender(){
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: document.getElementById('mainView')
    });
    renderer.setPixelRatio(window.devicePixelRatio); // 设备旋转
    // renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setSize(width, height);
    renderer.setClearColor(0xeeeeee);
    renderer.sortObjects = false;
    // document.body.appendChild(renderer.domElement);
}

// 初始化相机
function initCamera(){
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 40;
    camera.lookAt(0, 0, -10); //相机的看得方向，相当于法向量
}

// 初始化场景
function initScene(){
    scene = new THREE.Scene();
}

// 初始化事件监听
function initEventListener(){
    /* const _el = document.getElementsByTagName('canvas');
    let el;
    if (_el.length > 0){
        el = _el[0]; 
    } else {
        el = document;
    }*/
    el = document.getElementById('mainView');
    el.addEventListener('touchstart', touchStart, {
        passive: false
    });
    el.addEventListener('touchmove', touchMove, {
        passive: false
    });
    el.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('keydown', initKeyDown, false);
    document.addEventListener('keyup', initKeyUp, false);
    el.addEventListener('mousewheel', onMouseScrollChange, false);
    el.addEventListener('DOMMouseScroll', onMouseScrollChange, false);
}
function createBoxMesh(){
    var geometry = new THREE.BoxGeometry(300, 300, 300);
    const boxGeometry = new THREE.BoxGeometry(10,10,10);
    const boxMaterial = new THREE.MeshBasicMaterial({color:0xffff});
    const boxMesh = new THREE.Mesh(boxGeometry,boxMaterial);
    boxMesh.name = 'box';
    scene.add(boxMesh);
    const baseUrl = './img/'
        //左右 上下 前后 
    var arr = [
        loadTexture(baseUrl + 'l.jpg'),
        loadTexture(baseUrl + 'r.jpg'),
        loadTexture(baseUrl + 'u.jpg'),
        loadTexture(baseUrl + 'd.jpg'),
        loadTexture(baseUrl + 'f.jpg'),
        loadTexture(baseUrl + 'b.jpg')
    ];
    var material = new THREE.MultiMaterial(arr);
    mesh = new THREE.Mesh(geometry, material);
    mesh.scale.x *= -1; //功能：将网格里面的材质图片翻转，成为正面
    mesh.name = 'space';
    scene.add(mesh);  
}
// 初始化使用的模型
function init() {
    initStats();
    initScene();
    initCamera();
    initRender();
    initEventListener();
    createBoxMesh();
    animate();

}
function render() {
    stats.update();
    // console.log(stats);
    renderer.render(scene, camera);
}
function animate() {
    if(isMove == true){
        listenKeyDown();
    }
    requestAnimationFrame(animate);
    /*if(!isClick){
        update();
    }*/
    render();
}
// 相机的缩放倍数
const onMouseScrollChange = (e) => {
    // let e = e | window.event;
    let direct = 0;
    if (e.wheelDelta){
        direct = e.wheelDelta;
    } else if (e.detail) {
        direct = e.detail;
    }
    if (direct > 0 && camera.zoom > 0 && camera.zoom < 1.5){
        camera.zoom += 0.02;
    } else if (direct < 0 && camera.zoom > 1){
        camera.zoom -= 0.02;
    }
    camera.updateProjectionMatrix();
}
init();  
window.onload = function(){
    var event = event || window.event;
    event.preventDefault(); 
}    