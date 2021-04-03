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

var speed = 200;
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
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xeeeeee);
    renderer.sortObjects = false;
    document.body.appendChild(renderer.domElement);
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

// 初始化使用的模型
function init() {
    initScene();
    initCamera();
    initRender();
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
   
    document.addEventListener('touchstart', touchStart, {
        passive: false
    });
    document.addEventListener('touchmove', touchMove, {
        passive: false
    });
    document.addEventListener('mousedown', onMouseDown, false);
    // document.addEventListener('keydown', onKeyDown, false);
    // document.addEventListener('keyup', onKeyUp, false);
    document.addEventListener('keydown', initKeyDown, false);
    document.addEventListener('keyup', initKeyUp, false);
    animate();
    initStats();

}

function render() {
    //stats.update();
    renderer.render(scene, camera);
}
function animate() {
    // if(isMove == true){
        listenKeyDown();
    // }
    requestAnimationFrame(animate);
    /*if(!isClick){
        update();
    }*/
    render();
}
window.onresize = function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    render();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
init();  
window.onload = function(){
    var event = event || window.event;
    event.preventDefault(); 
}    