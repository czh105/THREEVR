/**
 * Created by LPH on 2017/11/27.
 */
var _scene = null;
var _source = null;
$(document).ready(function () {
    var href = location.href;
    var key = "";
    if (href.indexOf("key") > 0) {
        key = href.substring(href.indexOf("key") + 4);
    }
    new SupportComponent(key, "#camera");
});

"use strict";

var SupportComponent = (function () {
    var SupportComponent = function (key, target) {
        return new SupportComponent.fn.init(key, target);
    };

    SupportComponent.fn = SupportComponent.prototype = {
        constructor: SupportComponent,
        init: function (key, target) {
            var _this = this;
            _this.deviceIsMobile = true;
            _this.isWebRTC = false;
            _this.clipScreenAllowed = false;
            _this.interactingSupport = false;
            _this.renderCount = 0;
            _this.delay = 200;
            _this.scanCount = 0;
            _this.maxScanCount = 100;
            _this.maxWidth = 240;
            _this.maxHeight = 240;
            _this.recoApi = "/v3/reco/recognizeByData";
            _this.domainApi = "/api/editor/domain";
            _this.transformVideoApi = "/api/editor/videourl";
            _this.resourceDomain = "";
            _this.key = key;
            _this.target = target;
            _this.cameras = [];
            _this.camera_mode = 0;// 当前摄像头模式
            _this.objects = [];
            _this.audio = null;
            _this.stream = null;
            _this.camera = null;
            _this.deviceOrientationControls = null;
            if (_this.key == "") {
                _this.toggleLoadingStatus("hide", "WebAR链接不完整，请确认访问链接是否正确");
            } else {
                _this.checkDeviceIsPc();
                _this.checkBrowserMedia();
            }
        },
        checkDeviceIsPc: function () {
            var _this = this;
            var userAgentInfo = navigator.userAgent;
            var Agents = new Array("Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod");
            _this.deviceIsMobile = false;
            for (var v = 0; v < Agents.length; v++) {
                if (userAgentInfo.indexOf(Agents[v]) > 0) {
                    _this.deviceIsMobile = true;
                    break;
                }
            }
        },
        checkBrowserMedia: function () {
            var _this = this;
            var ua = navigator.userAgent.toLowerCase();

            if (ua.match(/MicroMessenger/i) == 'micromessenger' && ua.indexOf("iphone") > 0) {
                $(".fixed").hide();
                _this.selectImage();
            } else {
                if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                    _this.selectImage();
                } else if (typeof navigator.getUserMedia === "undefined" || typeof navigator.mediaDevices === "undefined" || typeof navigator.mediaDevices.getUserMedia === "undefined") {
                    _this.selectImage();
                } else if (navigator.mediaDevices.getUserMedia !== undefined) {
                    _this.getUserMedia();
                } else {
                    _this.selectImage();
                }
            }
        },
        selectImage: function () {
            var _this = this;
            _this.isWebRTC = false;

            $("#photo, #file").remove();
            $("body").append("<button id='photo'>拍图扫描</button><input id='file' type='file' accept='image/*'/>");
            $("body > p").html("");

            $("#photo").off().on("click", function () {
                $("#file").trigger("click");
            });
            $("#file").off().change(function (e) {
                var file = $("#file")[0].files[0];
                if (file != null) {
                    if (!/image\/\w+/.test(file.type)) {
                        _this.toggleLoadingStatus("hide", "请上传图片");
                        return false;
                    }
                } else {
                    return false;
                }
                var fileReader = new FileReader();

                fileReader.onload = function (e) {
                    _this.render(e.target.result, 0);
                };
                fileReader.readAsDataURL(file);
            });
        },
        render: function (src, angle) {

            var _this = this;
            var HasTranslateAngle = 0;
            var image = new Image();
            image.onload = function () {
                // 获取 canvas DOM 对象
                angle += HasTranslateAngle;
                if (angle == 0 || angle == 360) {
                    angle = 0;
                    HasTranslateAngle = 0;
                } else {
                    HasTranslateAngle += 90;
                    angle = HasTranslateAngle;
                }
                var canvas = document.getElementById("imageCvs");
                _this.resizeImage(image, _this.maxWidth, _this.maxHeight);
                canvas.width = image.width;
                canvas.height = image.height;
                var ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                var x = 0;
                var y = 0;
                if (angle > 0) {
                    if (angle == 90) {
                        x = canvas.height;
                        y = 0;
                        canvas.width = image.height;
                        canvas.height = image.width;
                    } else if (angle == 180) {
                        x = canvas.width;
                        y = canvas.height;
                        canvas.width = image.width;
                        canvas.height = image.height;
                    } else {
                        x = 0;
                        y = canvas.width;
                        canvas.width = image.height;
                        canvas.height = image.width;
                    }
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(angle * Math.PI / 180);
                }
                ctx.drawImage(image, 0, 0, image.width, image.height);
                ctx.restore();
                _this.uploadImage();
            };
            image.src = src;
        },
        resizeImage: function (image, iwidth, iheight) {
            var _this = this;
            if (image.width / image.height >= iwidth / iheight) {
                if (image.width > iwidth) {
                    image.height = (image.height * iwidth) / image.width;
                    image.width = iwidth;
                }
            } else {
                if (image.height > iheight) {
                    image.width = (image.width * iheight) / image.height;
                    image.height = iheight;
                }
            }
        },
        uploadImage: function () {
            var _this = this;
            var fileName = 'reco.png';
            var canvas = document.getElementById("imageCvs");
            var imagedata = canvas.toDataURL("image/png");
            if ((imagedata.length >> 10) > 200) {
                var image = new Image();
                image.onload = function () {
                    var data = jic.compress(image, 50, "png").src;
                    _this.uploadScanImage(data);
                };
                image.src = imagedata;
            } else {
                _this.uploadScanImage(imagedata);
            }
        },
        getUserMedia: function () {
            var _this = this;
            _this.cameras = [];

            var promise = navigator.mediaDevices.enumerateDevices();
            promise.then(function (devices) {
                console.log(devices)
                devices.map(e => {
                    if ("videoinput" === e.kind) {
                        _this.cameras.push(e);
                    }
                })
                if (_this.cameras.length > 0) {
                    _this.camera_mode = 0;
                    _this.displayUserMedia(_this.cameras[_this.camera_mode].deviceId);
                } else {
                    _this.selectImage();
                }
            });
        },
        displayUserMedia: function (deviceId) {
            var _this = this;

            var constraints = {
                audio: false,
                video: {
                    deviceId: {
                        exact: deviceId
                    }
                }
            };
            var promise = navigator.mediaDevices.getUserMedia(constraints);
            promise.then(function (mediaStream) {
                _this.onSuccess(mediaStream);
            }).catch(function (err) {
                _this.onError(err);
            });
        },
        onSuccess: function (stream) {
            var _this = this;
            var video = $("video" + _this.target)[0];
            _this.stream = stream;
            _this.isWebRTC = true;

            video.style.opacity = 1;
            video.srcObject = stream;

            video.onloadedmetadata = function () {
                video.play();
                if (typeof $(video).height() == "undefined" || $(video).height() == "" || $(video).height() < 100) {
                    _this.clipScreenAllowed = false;
                    _this.selectImage();
                } else {
                    $("canvas#screen").attr("height", $(video).height()).attr("width", $(video).width());
                    _this.clipScreenAllowed = true;
                    _this.clipScreen();
                    if (_this.cameras.length > 1) {
                        _this.cameraControl();
                    }
                }
            };
        },
        onError: function (err) {
            var _this = this;
            if (typeof err !== "undefined" && typeof err.name !== "undefined" && err.name !== "") {
                switch (err.name.toLowerCase()) {
                    case "notallowederror":
                        _this.toggleLoadingStatus("hide", "请允许浏览器访问相机");
                        break;
                    default:
                        _this.toggleLoadingStatus("hide", err);
                }
            } else {
                _this.toggleLoadingStatus("hide", (JSON.stringify(err) || "WebRTC ERROR"));
            }
        },
        clipScreen: function () {
            var _this = this;
            if (_this.clipScreenAllowed == false) {
                return false;
            }
            if (_this.scanCount <= _this.maxScanCount) {
                var video = document.querySelector("video" + _this.target);
                var canvas = document.querySelector("canvas#screen");
                var ctx = canvas.getContext("2d");

                ctx.drawImage(video, 0, 0);
                ++_this.scanCount;

                _this.isWebRTC = true;
                var fileReader = new FileReader();

                var imagedata = canvas.toDataURL("image/jpeg");
                if ((imagedata.length >> 10) > 200) {
                    var image = new Image();
                    image.onload = function () {
                        var data = jic.compress(image, 50, "jpeg").src;
                        _this.uploadScanImage(data);
                    };
                    image.src = imagedata;
                } else {
                    _this.uploadScanImage(imagedata);
                }
            } else {
                _this.toggleLoadingStatus("hide", "请对准识别物重新扫描");
                _this.scanCount = 0;
                setTimeout(function () {
                    $("p").text("将AR图放入框中，即可自动扫描");
                    _this.clipScreen();
                }, _this.delay);
            }
        },
        uploadScanImage: function (dataURL) {
            var _this = this;
            var render = false;
            var pass = false;
            var renderData = [];
            $(".loading-shell").removeClass("null");
            if (!_this.isWebRTC) {
                $("#photo").text("正在上传...");
            }
            $.ajax({
                url: _this.recoApi,
                type: "POST",
                dataType: "JSON",
                data: {
                    image: dataURL.replace("data:image/jpeg;base64,", "").replace("data:image/png;base64,", ""),
                    key: _this.key
                },
                error: function (xhr) {
                    pass = true;
                    _this.toggleLoadingStatus("hide", "网络异常");
                },
                success: function (result) {
                    //$("#test-image").remove();
                    //$("body").append("<img id='test-image' src='" + dataURL + "'/>");
                    switch (result.retCode) {
                        case 0:
                            if (+result.items[0].score < 10) {
                                if (_this.isWebRTC) {
                                    pass = true;
                                } else {
                                    pass = false;
                                    $(".loading-shell").addClass("null");
                                }
                            } else {
                                render = true;
                                renderData = result.items[0].resources;
                            }
                            $("#cameraControl").hide();
                            break;
                        case 1005:
                        case 1019:
                            if (_this.isWebRTC) {
                                pass = true;
                            } else {
                                pass = false;
                                $(".loading-shell").addClass("null");
                            }
                            break;
                        //case 1001:
                        //case 1002:
                        //case 3002:
                        //    _this.toggleLoadingStatus("hide", result.comment);
                        //    break;
                        default:
                            _this.toggleLoadingStatus("hide", result.comment);
                    }
                },
                complete: function () {
                    if (!_this.isWebRTC) {
                        $("#photo").text("拍图扫描");
                    }
                    if ((!render) && pass && _this.isWebRTC) {
                        setTimeout(function () {
                            _this.clipScreen();
                        }, _this.delay);
                    } else {
                        if (render) {
                            $("#photo").text("正在渲染...");
                            _this.renderResult(renderData);
                        }
                    }
                }
            });
        },
        cameraControl: function () {
            var _this = this;
            var camerasStr = "<div><div class='before'></div><div class='after'></div></div>";
            var name = "";
            var id = "";

            if ($("#cameraControl").length == 0) {
                $("body").append("<div id='cameraControl'>" + camerasStr + "</div>");
            }
            $("#cameraControl").off().on("click", function (e) {
                e.stopPropagation();
                $("#cameraControl").toggleClass("active");

                var video = document.querySelector("video" + _this.target);
                video.pause();
                _this.clipScreenAllowed = false;
                if (_this.cameras.length < 2) {
                    return false;
                }
                if (_this.deviceIsMobile) {
                    _this.stream.getTracks()[0].stop();
                    _this.maxScanCount = 100;

                    _this.camera_mode == 0 ? _this.camera_mode = 1 : _this.camera_mode = 0;
                    _this.displayUserMedia(_this.cameras[_this.camera_mode].deviceId);
                }
            });
        },
        toggleLoadingStatus: function (type, info) {
            var _this = this;
            if (typeof info !== "undefined" && info != "") {
                if (typeof info !== "undefined" && info != "") {
                    if (typeof info == "object") {
                        info = info.name
                    }
                    if (typeof info !== "string" && info.indexOf('"') > -1) {
                        info = info.replace(/\"/g, "");
                    }
                }
            }
            switch (type) {
                case "hide":
                    $(".loading-line").removeClass("active");
                    $("p").text(info);
                    setTimeout(function () {
                        alert(info);
                    }, 0);
                    break;
                case "active":
                    $(".loading-shell").show();
                    $(".loading-line").addClass("active");
                    $("p").text(info);
                    break;
                case "model":
                    $(".loading-shell, p").hide();
                    $("body").find("#photo").hide();
                    break;
                case "render":
                    $(".loading-shell, p").hide();
                    $(".mask").show();
                    $("button#scanBtn").off().on("click", function (e) {
                        e.stopPropagation();
                        $(".loading-shell, p").show();
                        $(".loading-line").removeClass("active");
                        $(".mask").hide();
                        $("p").text("将AR图放入框中，即可自动扫描");
                        $(".mask > video.player")[0].pause();
                        $(".mask > video.player").trigger('pause');
                        $(".mask > video.player").remove();
                        $(".mask").prepend('<video class="player" src="" preload="auto" controls webkit-playsinline="true" playsinline="true" ' +
                            'x-webkit-airplay="allow" x5-video-player-type="h5" ' +
                            'x5-video-player-fullscreen="true" ' +
                            'x5-video-orientation="portraint"></video>');
                        _this.scanCount = 0;
                        setTimeout(function () {
                            if (_this.isWebRTC) {
                                _this.clipScreen();
                            } else {
                                _this.selectImage();
                            }
                        }, _this.delay);
                    });
                    break;
            }
        },
        renderResult: function (data) {
            var _this = this;
            var count = 0;
            var renderModel = false;
            var renderHref = "";
            var renderVideo = "";
            var modelsData = [];
            if (data.length == 0) {
                setTimeout(function () {
                    _this.scanCount = 0;
                    _this.clipScreen();
                }, _this.delay);
            } else {
                for (var i = 0; i < data.length; ++i) {
                    switch (data[i].sourceType) {
                        case 1:
                            renderHref = data[i].data.content;
                            ++count;
                            break;
                        case 3:
                            renderVideo = data[i].data.content;
                            ++count;
                            break;
                        case 12:
                            renderModel = true;
                            modelsData = data[i].data.objects;
                            count = 3;
                            break;
                    }
                }
                if (count == 0) {
                    if (_this.isWebRTC) {
                        setTimeout(function () {
                            _this.scanCount = 0;
                            _this.clipScreen();
                        }, _this.delay);
                    } else {
                        _this.toggleLoadingStatus("hide", "请对准识别物重新拍照");
                        _this.selectImage();
                    }
                } else if (count == 1) {
                    _this.toggleLoadingStatus("active", "识别成功！");
                    if (renderHref != "") {
                        location.href = renderHref
                    } else {
                        location.href = renderVideo;
                    }
                } else {
                    if (renderModel) {
                        _this.toggleLoadingStatus("active", "");
                        _this.getDomain(modelsData);
                        //_this.addRefresh();
                    } else {
                        $(".mask > div > a").attr("href", renderHref);
                        $(".mask > video.player").attr("src", renderVideo);
                        $("#photo").hide();
                        setTimeout(function () {
                            _this.toggleLoadingStatus("render", "");
                        }, 0);
                    }
                }
            }
        },
        addRefresh: function () {
            var _this = this;
            $("#refreshButton").remove();
            $("body").append("<div id='refreshButton'><</div>");
            setTimeout(function () {
                $("#refreshButton").off().on("click", function (e) {
                    e.stopPropagation();
                    $(".loading-shell, p").show();
                    $(".loading-line").removeClass("active");
                    $(".mask").hide();
                    $("canvas:not(#imageCvs, #screen)").remove();
                    $("p").text("将AR图放入框中，即可自动扫描");
                    _this.scanCount = 0;
                    setTimeout(function () {
                        if (_this.isWebRTC) {
                            _this.clipScreen();
                        } else {
                            _this.selectImage();
                        }
                    }, _this.delay);
                });
            }, 0);
        },
        getDomain: function (modelsData) {
            var _this = this;
            _this.toggleLoadingStatus("active", "");
            $.ajax({
                url: _this.domainApi,
                type: "GET",
                dataType: 'json',
                async: true,
                error: function () {
                    _this.toggleLoadingStatus("hide", "网络异常");
                },
                success: function (result) {
                    switch (result.retCode) {
                        case 0:
                            _this.toggleLoadingStatus("active", "");
                            _this.resourceDomain = result.domain;
                            _this.initScene(modelsData);
                            break;
                        default:
                            _this.toggleLoadingStatus("hide", result.comment);
                    }
                }
            });

        },
        initScene: function (data) {
            var _this = this;
            _this.objects = [];
            _this.toggleLoadingStatus("active", "");
            var length = data.length;
            _this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 10, 10000);
            var scene = new THREE.Scene();
            _scene = scene;
            var renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true
            });
            var ambientLight = new THREE.AmbientLight(0xffffff);
            var directionalLight = new THREE.DirectionalLight(0xffffff, 0.1);
            var controls = new THREE.OrbitControls(_this.camera);
            _this.deviceOrientationControls = new THREE.DeviceOrientationControls(_this.camera);

            _this.camera.position.set(500, 700, 500);
            _this.camera.lookAt(new THREE.Vector3());
            directionalLight.rotationX = 90;

            _this.renderCount = 0;
            for (var j = 0; j < length; ++j) {
                switch (data[j].materialType) {
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case "videoGroup":
                    case 5:
                    case 6:
                        ++_this.renderCount;
                        break;
                }
            }
            for (var i = 0; i < length; ++i) {
                switch (data[i].materialType) {
                    case 1:
                        if (data[i].type === "link") {
                            window.location.href = data[i].href;
                        }
                        _this.renderWebModel(data[i], scene);

                        break;
                    case 2:
                        _this.renderImageModel(data[i], scene);
                        break;
                    case 3:
                    case "videoGroup":
                        _this.renderVideoModel(data[i], scene);
                        break;
                    case 4:
                        _this.renderMusicModel(data[i], scene);
                        break;
                    case 5:
                        _this.renderTextModel(data[i], scene);
                        break;
                    case 6:
                        _this.renderFBXModel(data[i], scene);
                        break;
                }
            }

            scene.add(ambientLight);
            scene.add(directionalLight);

            renderer.setSize(document.body.offsetWidth, document.body.offsetHeight);
            document.body.appendChild(renderer.domElement);

            checkRender();

            window.addEventListener("orientationchange", function () {
                setTimeout(function () {
                    renderer.setSize(document.body.offsetWidth, document.body.offsetHeight);
                    render();
                }, 400);
            }, false);

            if (_this.interactingSupport) {
                _this.addObjectInteracte();
            }

            function checkRender() {
                console.log(_this.renderCount)
                if (_this.renderCount == 0) {
                    console.log("render")
                    render();
                    if (_this.audio != null) { }
                    clearTimeout(checkRender);
                    return false;
                } else {
                    setTimeout(function () {
                        checkRender();
                    }, 200);
                }
            }

            function render() {
                requestAnimationFrame(render);
                if (_this.deviceOrientationControls) {
                    _this.deviceOrientationControls.update();
                }
                renderer.render(scene, _this.camera);
                _this.toggleLoadingStatus("model", "");
            }
        },
        addObjectInteracte: function () {
            var _this = this;
            var mouse = new THREE.Vector2();
            var raycaster = new THREE.Raycaster();
            var onDownPosition = new THREE.Vector2();
            var onUpPosition = new THREE.Vector2();
            var onDoubleClickPosition = new THREE.Vector2();

            function getIntersects(point, objects) {

                mouse.set((point.x * 2) - 1, -(point.y * 2) + 1);
                raycaster.setFromCamera(mouse, _this.camera);
                return raycaster.intersectObjects(objects);
            }

            function getMousePosition(dom, x, y) {
                var rect = dom.getBoundingClientRect();
                return [(x - rect.left) / rect.width, (y - rect.top) / rect.height];
            }

            function handleClick() {

                if (onDownPosition.distanceTo(onUpPosition) === 0) {

                    var intersects = getIntersects(onDownPosition, _this.objects);

                    if (intersects.length > 0) {

                        var object = intersects[0].object;
                        if (object.name == "Object004") {
                            window.open("http://www.hiscene.com");
                        }

                    }
                }
            }

            document.removeEventListener('touchend', onTouchEnd, false);
            document.addEventListener('touchend', onTouchEnd, false);
            document.removeEventListener('mouseup', onMouseUp, false);
            document.addEventListener('mouseup', onMouseUp, false);
            document.addEventListener('mousedown', onMouseDown, false);

            function onTouchEnd(event) {
                var touch = event;
                if (typeof event.changedTouches !== "undefined") {
                    touch = event.changedTouches[0];
                }
                var array = getMousePosition($("body")[0], touch.clientX, touch.clientY);
                onDownPosition.fromArray(array);

                handleClick();

                document.removeEventListener('touchend', onTouchEnd, false);
            }

            function onMouseDown(event) {
                event.preventDefault();

                var array = getMousePosition($("body")[0], event.clientX, event.clientY);
                onDownPosition.fromArray(array);
                document.addEventListener('mouseup', onMouseUp, false);
            }

            function onMouseUp(event) {
                var array = getMousePosition($("body")[0], event.clientX, event.clientY);
                onUpPosition.fromArray(array);
                handleClick();

                document.removeEventListener('mouseup', onMouseUp, false);
            }
        },
        renderVideoModel: function (data, scene) {
            var _this = this;
            var video = document.createElement('video');
            var url = data.content;
            var cav = document.createElement('canvas');
            var ctx = cav.getContext('2d');
            var texture, geometry, material, mesh;

            video.crossOrigin = '';

            if (_this.resourceDomain != "") {
                if (url.indexOf(_this.resourceDomain) != 0) {
                    $.ajax({
                        url: _this.transformVideoApi,
                        dataType: 'json',
                        type: 'POST',
                        async: false,
                        data: {
                            url: encodeURIComponent(url)
                        },
                        error: function () {
                            _this.toggleLoadingStatus("hide", "网络异常");
                        },
                        success: function (result) {
                            switch (result.retCode) {
                                case 0:
                                    url = "/api/editor/transformvideo?key=" + result.value;
                                    addUrlToVideo();
                                    break;
                                default:
                                    _this.toggleLoadingStatus("hide", result.comment);
                            }
                        }
                    })
                } else {
                    url = url.replace(_this.resourceDomain, "");
                    if (url[0] == "/") {
                        url = url.substring(1);
                    }
                    addUrlToVideo();
                }
            }

            function addUrlToVideo() {
                video.src = url;
                video.autobuffer = true;
                video.loop = data.isLoopPlay || true;
                video.type = "video";
                video.muted = "video";

                if (_this.deviceIsMobile) {
                    --_this.renderCount;
                }
                video.onloadedmetadata = function () {
                    video.play();
                    texture = new THREE.VideoTexture(video);
                    texture.minFilter = THREE.LinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.format = THREE.RGBFormat;
                    texture.needsUpdate = true;
                    geometry = new THREE.PlaneGeometry(video.videoWidth, video.videoHeight);
                    material = new THREE.MeshBasicMaterial({
                        map: texture,
                        overdraw: true,
                        side: THREE.DoubleSide
                    });
                    mesh = new THREE.Mesh(geometry, material);
                    mesh.position.set(0, 0, 0);
                    mesh.rotation.set(data.rotationX * THREE.Math.DEG2RAD, data.rotationY * THREE.Math.DEG2RAD, data.rotationZ * THREE.Math.DEG2RAD); // Math.PI / 180
                    mesh.scale.set(data.scaleX, data.scaleY, data.scaleZ);

                    scene.add(mesh);
                    --_this.renderCount;
                };
            }
        },
        renderTextModel: function (data, scene) {
            var _this = this;
            var texture = _this.createTextTextaure(data);
            var geometry = new THREE.PlaneGeometry(texture.image.width, texture.image.height);
            var material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide
            });
            material.transparent = true;
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(data.positionX || 0, data.positionY || 10, data.positionZ || 0);
            mesh.rotation.set(data.rotationX * THREE.Math.DEG2RAD || -(Math.PI / 2), data.rotationY * THREE.Math.DEG2RAD || 0, data.rotationZ * THREE.Math.DEG2RAD || 0);
            mesh.scale.set(data.scaleX || 1, data.scaleY || 1, data.scaleZ || 1);
            scene.add(mesh);
            --_this.renderCount;
        },
        createTextTextaure: function (textInfo) {
            var _this = this;
            var cav = document.createElement('canvas');
            var ctx = cav.getContext('2d');
            ctx.font = textInfo.size + "px " + textInfo.font;
            var textWidth = ctx.measureText(textInfo.content).width;
            var height = 4 * textInfo.size / 3;
            cav.width = textWidth;
            cav.height = height;
            ctx.fillStyle = textInfo.color;
            ctx.font = textInfo.size + "px " + textInfo.font;
            ctx.fillText(textInfo.content, 0, textInfo.size);
            var texture = new THREE.Texture(cav);
            texture.needsUpdate = true;
            return texture;
        },
        renderImageModel: function (data, scene) {
            var _this = this;
            var loader = new THREE.ImageLoader();
            var url = data.content;
            if (_this.resourceDomain != "") {
                url = data.content.replace(_this.resourceDomain, "");
                if (url[0] == "/") {
                    url = url.substring(1);
                }
            }

            loader.load(url,
                function (image) {
                    var cav = document.createElement('canvas');
                    cav.width = image.width;
                    cav.height = image.height;
                    var ctx = cav.getContext('2d');
                    ctx.drawImage(image, 0, 0, image.width, image.height);
                    var texture = new THREE.Texture(cav);
                    texture.needsUpdate = true;
                    var material = new THREE.MeshBasicMaterial({
                        map: texture,
                        side: THREE.DoubleSide
                    });
                    material.transparent = true;
                    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(cav.width, cav.height), material);
                    mesh.position.set(data.positionX || 0, data.positionY || 10, data.positionZ || 0);
                    mesh.rotation.set(data.rotationX * THREE.Math.DEG2RAD || -(Math.PI / 2), data.rotationY * THREE.Math.DEG2RAD || 0, data.rotationZ * THREE.Math.DEG2RAD || 0);
                    mesh.scale.set(data.scaleX || 1, data.scaleY || 1, data.scaleZ || 1);
                    scene.add(mesh);
                    --_this.renderCount;
                }
            );
        },
        renderWebModel: function (data, scene) {
            var _this = this;
            var texture = _this.createHrefTextaure(data);
            var geometry = new THREE.PlaneGeometry(texture.image.width, texture.image.height);
            var material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide
            });
            material.transparent = true;
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(data.positionX || 0, data.positionY || 10, data.positionZ || 0);
            mesh.rotation.set(data.rotationX * THREE.Math.DEG2RAD || -(Math.PI / 2), data.rotationY * THREE.Math.DEG2RAD || 0, data.rotationZ * THREE.Math.DEG2RAD || 0);
            mesh.scale.set(data.scaleX || 1, data.scaleY || 1, data.scaleZ || 1);
            scene.add(mesh);
            --_this.renderCount;
        },
        createHrefTextaure: function (hrefInfo) {
            var _this = this;
            var cav = document.createElement('canvas');
            var ctx = cav.getContext('2d');
            ctx.font = hrefInfo.size + "px " + hrefInfo.font;
            var textWidth = ctx.measureText(hrefInfo.content).width;
            var height = 4 * hrefInfo.size / 3;
            cav.width = textWidth;
            cav.height = height;
            if (hrefInfo.displayBackground) {
                ctx.fillStyle = hrefInfo.backgroundColor;
                ctx.fillRect(0, 0, cav.width, cav.height);
                ctx.stroke();
            }
            ctx.fillStyle = hrefInfo.color;
            ctx.font = hrefInfo.size + "px " + hrefInfo.font;
            ctx.fillText(hrefInfo.content, 0, hrefInfo.size);
            var texture = new THREE.Texture(cav);
            texture.needsUpdate = true;
            return texture;
        },
        renderMusicModel: function (data, scene) {
            var _this = this;
            var url = data.content;
            if (_this.resourceDomain != "") {
                url = url.replace(_this.resourceDomain, "");
                if (url[0] == "/") {
                    url = url.substring(1);
                }
            }
            new THREE.AudioLoader().load(url, function (buffer) {
                var listener = new THREE.AudioListener();
                var audio = new THREE.Audio(listener).setBuffer(buffer);
                audio.setVolume(0.5);
                audio.setLoop(true);
                audio.play();
                scene.add(audio);
                --_this.renderCount;
            });
        },
        renderFBXModel: function (data, scene) {
            var _this = this;
            var mixers = [];
            var clocks = [];
            var loader, model;
            var manager = new THREE.LoadingManager();

            if (_this.resourceDomain != "") {
                model = data.model.replace(_this.resourceDomain, "");
            }
            manager.onProgress = function (item, loaded, total) {
                _this.toggleLoadingStatus("active", "");
            };
            var onProgress = function (xhr) {
                if (xhr.lengthComputable) {
                    var percentComplete = xhr.loaded / xhr.total * 100;
                    console.log(percentComplete)
                    if ((Math.round(percentComplete, 2)) < 100) {
                        _this.toggleLoadingStatus("active", "");
                        $(".loading-shell > span").text("模型加载中..." + (Math.round(percentComplete, 2)) + "%");
                    } else {
                        _this.toggleLoadingStatus("model", "");
                    }
                }
            };
            var onError = function (xhr) {
                console.warn(xhr);
                --_this.renderCount;
            };
            loader = new THREE.FBXLoader(manager);
            loader.load(model, function (object) {
                object.position.set(data.positionX || 0, data.positionY || 0, data.positionZ || 0);
                object.rotation.set(data.rotationX * THREE.Math.DEG2RAD || 0, data.rotationY * THREE.Math.DEG2RAD || 0, data.rotationZ * THREE.Math.DEG2RAD || 0);
                object.scale.set(data.scaleX || 1, data.scaleY || 1, data.scaleZ || 1);

                object.mixer = new THREE.AnimationMixer(object);
                mixers.push(object.mixer);
                clocks.push(new THREE.Clock());

                if (object.animations && object.animations.length > 0) {
                    var action = object.mixer.clipAction(object.animations[0]);
                    action.play();
                }
                scene.add(object);
                if (_this.interactingSupport) {
                    if (object.children.length > 0) {
                        for (var i = 0; i < object.children.length; ++i) {
                            _this.objects.push(object.children[i]);
                        }
                    } else {
                        _this.objects.push(object);
                    }
                }
                --_this.renderCount;
            }, onProgress, onError);

            animate();

            function animate() {
                requestAnimationFrame(animate);
                if (mixers.length > 0) {
                    for (var i = 0; i < mixers.length; ++i) {
                        mixers[i].update(clocks[i].getDelta());
                    }
                } else {
                    return false;
                }
            }
        }
    };

    SupportComponent.fn.init.prototype = SupportComponent.fn;

    return SupportComponent;
})();