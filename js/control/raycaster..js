var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
let clickedPosition = new THREE.Vector3(0, 0, 40);
function onMouseClickMesh(e){
    // e.preventDefault();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    // 通过鼠标点的位置和当前相机的矩阵计算出raycaster
    raycaster.setFromCamera(mouse,camera);
    // 获取raycaster直线和所有模型相交的数组集合
    var intersects = raycaster.intersectObjects( scene.children );
    let firstMeshObject = intersects[0];
    if (firstMeshObject.object.type == 'Mesh'){
        if (firstMeshObject.object.name != 'space'){
            console.log('被点击的事务：'+firstMeshObject);
        }
        /* else {
            
            clickedPosition = firstMeshObject.point;
            console.log("点击点坐标："+clickedPosition.x,clickedPosition.y,clickedPosition.z);
            cameraAnimate();
        }*/
    }
    
}

// 鼠标右键
function cameraAnimate(){
    let xAxis = clickedPosition.x - camera.position.x;
    let zAxis = clickedPosition.z - camera.position.z;
    camera.lookAt(clickedPosition);
    let lonDistance = Math.sqrt((Math.pow(xAxis,2) + Math.pow(zAxis,2)));
    let direction = new THREE.Vector3(xAxis, 0, zAxis);
    direction.normalize();// 法向量的值归一化
    if (lonDistance >= 20){
        camera.translateX(10 * direction.x);
        camera.translateZ(10 * direction.z);
        camera.updateProjectionMatrix();
        render();
    }
}