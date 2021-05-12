window.onorientationchange = function(){
    let angle = window.orientation;
    switch(angle){
        case 0:   
            break;
        case 90:
            windowRationRight();
            break;
        case -90:
            windowRationLeft();
            break;
        case 180:
            windowRationDown();
            break;
    }
}
window.onresize = function() {
    width = document.getElementById('mainView').width;
    height = document.getElementById('mainView').height;
    _width = document.getElementById('secondView').width;
    _height = document.getElementById('secondView').height;
    _camera.aspect = _width / _height;
    _camera.updateProjectionMatrix();
    initSecondRenderer();
    _renderer.setSize(_width, _height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
    renderer.setSize(width, height);
}
//屏幕右旋
var windowRationRight = function(){

}
//屏幕左旋
var windowRationLeft = () => {

}
//屏幕倒转
var windowRationDown = () => {

}

// 按键down事件监听
function initKeyDown(e){
    switch(e.keyCode){
        case 38: // up
        case 87: // w
            moveForward = true;
            isMove = true;
            break;
        case 37: // left
        case 65: // a
            moveLeft = true;
            isMove = true;
            break;
        case 40: // down
        case 83: // s
            moveBackward = true;
            isMove = true;
            break;
        case 39: // right
        case 68: // d
            moveRight = true;
            isMove = true;
            break;
    }
}

// 按键up事件监听
function initKeyUp(e){
    switch(e.keyCode){
        case 38: // up
        case 87: // w
            moveForward = false;
            isMove = false;
            break;
        case 37: // left
        case 65: // a
            moveLeft = false;
            isMove = false;
            break;
        case 40: // down
        case 83: // s
            moveBackward = false;
            isMove = false;
            break;
        case 39: // right
        case 68: // d
            moveRight = false;
            isMove = false;
            break;
    }
}

function listenKeyDown(){
    if(!isMove){
        return;
    }
    // 刷新获取时间
    let delta = clock.getDelta();
    // speed 每次的速度，保证过渡
    dirSpeed.x -= dirSpeed.x * 10.0 * delta;
    dirSpeed.z -= dirSpeed.z * 10.0 * delta;
    dirSpeed.y -= 9.8 * 100.0 * delta; // 默认下降的速度

    // 获取当前按键的方向并且获取朝着那个方向移动
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveLeft)  - Number(moveRight);
    // direction.y = 0;

    // 方向向量归一化
    direction.normalize();
    // 判断是否接触到了模型
    rotation.copy(camera.getWorldDirection().multiply(new THREE.Vector3(-1, 0, -1)));

    // 判断鼠标按下的方向
    var m = new THREE.Matrix4();
    if (direction.z > 0){
        if (direction.x > 0){
            m.makeRotationY(Math.PI / 4);
        } else if (direction.x < 0){
            m.makeRotationY(-Math.PI / 4);
        } else {
            m.makeRotationY(0);
        }
    } else if (direction.z < 0){
        if (direction.x > 0){
            m.makeRotationY(Math.PI / 4 * 3);
        } else if (direction.x < 0){
            m.makeRotationY(-Math.PI / 4 * 3);
        } else {
            m.makeRotationY(Math.PI);
        }
    } else {
        if (direction.x > 0){
            m.makeRotationY(Math.PI / 2);
        } else if (direction.x < 0){
            m.makeRotationY(-Math.PI / 2);
        }
    }
    // 给向量使用变换矩阵
    rotation.applyMatrix4(m);
    horizontalRaycaster.set(camera.position, rotation);
    
    var horizontalIntersections = horizontalRaycaster.intersectObjects(scene.children, true);
    var horOnObject = horizontalIntersections.length > 0;

    //判断移动方向修改速度方向
    if (!horOnObject) {
        if (moveForward || moveBackward) dirSpeed.z -= direction.z * speed * delta;
        if (moveLeft || moveRight) dirSpeed.x -= direction.x * speed * delta;
    }

    //复制相机的位置
    downRaycaster.ray.origin.copy(camera.position);
    //获取相机靠下10的位置
    downRaycaster.ray.origin.y -= 40;
    //判断是否停留在了立方体上面
    var intersections = downRaycaster.intersectObjects(scene.children, true);
    var onObject = intersections.length > 0;
    //判断是否停在了立方体上面
    if (onObject === true) {
        dirSpeed.y = Math.max(0, dirSpeed.y);
        // canJump = true;
    }
    //根据速度值移动相机
    if(isMove === true){
        camera.translateX(dirSpeed.x * delta);
        camera.translateY(dirSpeed.y * delta);
        camera.translateZ(dirSpeed.z * delta);
    }
    if(camera.position.y < 0){
        dirSpeed.y = 0;
        camera.position.y = 0;
    }
}