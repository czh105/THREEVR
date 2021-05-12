var _scene, _renderer, _camera, _light, _plane, _mesh;
var _meshes = new Array();
var _width = document.getElementById('secondView').width;
var _height = document.getElementById('secondView').height;
const createSphereMesh = () => {
    // 初始化场景对象
    let url = './img/sphere.jpg'
    scene.children = [];
    let sphereGeometry = new THREE.SphereGeometry(100,100,100);
    let sphereTexture = new THREE.TextureLoader().load(url);
    sphereTexture.needsUpdate = true;
    sphereTexture.wrapS = THREE.MirroredRepeatWrapping;
    sphereTexture.wrapT = THREE.MirroredRepeatWrapping;
    // texture.repeat = new THREE.Vector2(10,10);
    let sphereMaterial = new THREE.MeshBasicMaterial({
        map: sphereTexture,
        side: THREE.BackSide
    });
    let sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphereMesh);
    // createSecondViewScene();
}
function createSecondViewScene(){
    initSecondScene();
    initSecondRenderer();
    initSecondCamera();
    addMesh();
    initScecondSceneLight();
    secondSceneAnimate();
}
const addMesh = () => {
    let geometry = new THREE.BoxGeometry(10, 10, 10);
    let material = new THREE.MeshBasicMaterial({color: 0x0000ff});
    _mesh = new THREE.Mesh(geometry, material);
    _mesh.position.set(0, 0, -100);
    _mesh.receiveShadow = true;
    _mesh.castShadow = true;
    _mesh.visible = false;
    let _geometry = new THREE.PlaneGeometry( 2000, 2000 );
    let _material = new THREE.MeshPhongMaterial( { color: 0x808080, dithering: true } );
    _plane = new THREE.Mesh( _geometry, _material );
    _plane.position.set( 0, - 1, 0 );
    _plane.rotation.x = - Math.PI * 0.5;
    _plane.receiveShadow = true;
    // _plane.visible = false;
    _scene.add(_plane);
    _scene.add(_mesh);
}
const initSecondCamera = () => {
    _camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    _camera.position.z = 200;
    _camera.lookAt(0, 0, -1); //相机的看得方向，相当于法向量
}
const initSecondScene = () => {
    _scene = new THREE.Scene();
}
const initSecondRenderer = () => {
    _renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: document.getElementById('secondView')
    });
    _renderer.setPixelRatio(window.devicePixelRatio); // 设备旋转
    _renderer.setSize(_width, _height);
    _renderer.setClearColor(0xeeeeee);
    _renderer.sortObjects = false;
    _renderer.shadowMap.enabled = true;
	_renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	_renderer.outputEncoding = THREE.sRGBEncoding;
    // document.body.appendChild(renderer.domElement);
}
const initScecondSceneLight = () => {
    // 模拟视角
    _light = new THREE.SpotLight(0xff0000);
    _light.position.set(0, 0, 0);
    _light.castShadow = true; // 聚光灯将投射阴影
    _light.shadow.mapSize.width = 1024;// 1024;
    _light.shadow.mapSize.height = 1024;// 1024;
    _light.shadow.camera.near = 10;
    _light.shadow.camera.far = 300;
    _light.shadow.camera.fov = 75; 
    _light.decay = 2; // 沿着光照距离的衰减量
    _light.distance = 400;
    _light.angle = Math.PI / 8;
    _scene.add(_light);
    _light.target = _mesh;
    _camera.position.set(0,200,0);
    _camera.lookAt(0, -1, 0);
}
const secondSceneRender = () => {
    _renderer.render(_scene, _camera)
}

const secondSceneAnimate = () => {
    requestAnimationFrame(secondSceneAnimate);
    secondSceneRender();
}
createSecondViewScene();