const params = {
    format:THREE.DepthFormat,
    type:THREE.UnsignedShortType
};
const formats = {
    DepthFormat: THREE.DepthFormat, DepthStencilFormat: THREE.DepthStencilFormat
};
const type = {UnsignedShortType: THREE.UnsignedShortType, UnsignedIntType: THREE.UnsignedIntType, UnsignedInt248Type: THREE.UnsignedInt248Type}
/**
 * 材质纹理
 */
function CubeTexture(path,names){
    var loader = new THREE.CubeTextureLoader();
    loader.setPath(path);
    var textureCube = loader.load(names);
    return textureCube;
}
/**
 * video材质
 */
function VideoTexture(){
    var video = document.getElementById('video');
    var textureVideo = new THREE.VideoTexture(video);
    //当一个纹理覆盖小于一个像素是，贴图如何采样(默认值LinearMipMapLinearFilter)
    textureVideo.minFilter = THREE.LinearFilter;
    //当一个纹理覆盖大于一个像素是，贴图如何采样
    textureVideo.magFilter = THREE.LinearFilter;
    //纹理贴图使用的格式
    textureVideo.format = THREE.RGBFormat;
    return textureVideo;
}
/**
 * 纹理
 *
 */
function initTexture(url){
    var loader = new THREE.TextureLoader();
    var texture = loader.load(url);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    //纹理重复x：4，y:4
    //texture.repeat.set(4,4);
    //纹理偏移量(0.0~1.0)
    //texture.ffset = new THREE.Vector2(x,y);
    //纹理绕中心点旋转多少度
    //texture.rotation = Math.PI;
    //纹理旋转中心点(0.5,0.5)对应正中心
    //texture.center = THREE.Vector2(0.5,0.5);
    texture.needsUpdate = true;
    texture.updateMatrix();
    return texture;
}