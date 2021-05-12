"use strict";
THREE.DeviceOrientationControls = function(e) {
    document.getElementById("debugEl");
    var n = this;
    this.object = e,
    this.object.rotation.reorder("YXZ"),
    this.enabled = !0,
    this.deviceOrientation = {},
    this.screenOrientation = 0,
    this.customOrientation = {
        alpha: 0,
        beta: 0,
        gamma: 0
    },
    this.targetOrientation = {
        alpha: 0,
        beta: 0,
        gamma: 0
    };
    var o;
    this.filterQuaternionInfo = {
        q: new THREE.Quaternion,
        alpha: 0
    },
    this.isGetCustom = !1,
    this.isGyro = !1,
    this.isSetPre = !0;
    var t, i, a, r, s = function s(e) {
        n.deviceOrientation = e,
        n.isGetCustom && (n.isGetCustom = !1,
        n.isGyro = !0,
        n.object.quaternion.setFromEuler(new THREE.Euler(0,0,0), !1),
        n.customOrientation = n.deviceOrientation)
    }, d = function d() {
        n.screenOrientation = window.orientation || 0
    };
    t = new THREE.Vector3(0,0,1),
    i = new THREE.Euler,
    a = new THREE.Quaternion,
    r = new THREE.Quaternion(-Math.sqrt(.5),0,0,Math.sqrt(.5));
    this.connect = function() {
        d(),
        window.addEventListener("orientationchange", d, !1),
        window.addEventListener("deviceorientation", s, !1),
        n.enabled = !0
    }
    ,
    this.disconnect = function() {
        window.removeEventListener("orientationchange", d, !1),
        window.removeEventListener("deviceorientation", s, !1),
        n.enabled = !1
    }
    ,
    this.setCustomQuaternion = function() {
        n.isGetCustom = !0
    }
    ,
    this.getObjectQuaternion = function() {
        return {
            alpha: n.deviceOrientation.alpha ? THREE.Math.degToRad(n.deviceOrientation.alpha) : 0,
            beta: n.deviceOrientation.beta ? THREE.Math.degToRad(n.deviceOrientation.beta) : 0,
            gamma: n.deviceOrientation.gamma ? THREE.Math.degToRad(n.deviceOrientation.gamma) : 0,
            orient: n.screenOrientation ? THREE.Math.degToRad(n.screenOrientation) : 0
        }
    }
    ,
    this.transformObjectQuaternion = function() {
        var e = n.customOrientation
          , t = n.deviceOrientation;
        return n.targetOrientation = {
            alpha: (360 + t.alpha - e.alpha) % 360,
            beta: (t.beta - e.beta + 360 + 270) % 360 - 180,
            gamma: (t.gamma - e.gamma + 180 + 90) % 180 - 90
        },
        {
            alpha: n.targetOrientation.alpha ? THREE.Math.degToRad(n.targetOrientation.alpha) : 0,
            beta: n.targetOrientation.beta ? THREE.Math.degToRad(n.targetOrientation.beta) : 0,
            gamma: n.targetOrientation.gamma ? THREE.Math.degToRad(n.targetOrientation.gamma) : 0,
            orient: n.screenOrientation ? THREE.Math.degToRad(n.screenOrientation) : 0
        }
    }
    ,
    this.update = function() {
        if (!1 !== n.enabled && 0 != n.isGyro) {
            var e = new THREE.Quaternion;
            if (e.setFromEuler(new THREE.Euler(n.deviceOrientation.alpha / 360 * Math.PI * 2,n.deviceOrientation.beta / 360 * Math.PI * 2,n.deviceOrientation.gamma / 360 * Math.PI * 2), !1),
            n.isSetPre)
                n.isSetPre = !1;
            else {
                var t = new THREE.Quaternion(-o._x,-o._y,-o._z,o._w)
                  , i = new THREE.Quaternion;
                i.setFromEuler(new THREE.Euler(n.deviceOrientation.alpha / 360 * Math.PI * 2,n.deviceOrientation.beta / 360 * Math.PI * 2,n.deviceOrientation.gamma / 360 * Math.PI * 2), !1),
                i.multiplyQuaternions(t, i),
                i = new THREE.Quaternion(i._y,i._z,i._x,i._w),
                this.arFilterQuaternion(this.filterQuaternionInfo, i, !1),
                n.object.quaternion.multiplyQuaternions(n.object.quaternion, this.filterQuaternionInfo.q)
            }
            o = e
        }
    }
    ,
    this.connect(),
    this.arUtilQuatNorm = function(e) {
        var t, i;
        return (t = e.x * e.x + e.y * e.y + e.z * e.z + e.w * e.w) ? (i = Math.sqrt(t),
        e.x /= i,
        e.y /= i,
        e.z /= i,
        e.w /= i,
        e) : -1
    }
    ,
    this.arFilterQuaternionSetParams = function(e, t, i) {
        var n, o;
        return e ? t && i ? (n = 1 / t,
        o = 1 / i,
        e.alpha = n / (n + o),
        this.filterQuaternionInfo = e) : -2 : -1
    }
    ,
    this.arFilterQuaternion = function(e, t, i) {
        var n, o, a, r, s, d, l;
        if (!e)
            return -1;
        var c = e.q || new THREE.Quaternion;
        return t = this.arUtilQuatNorm(t),
        e.q = i ? t : (o = 1 - (n = e.alpha),
        (r = t.x * c.x + t.y * c.y + t.z * c.z + t.w * c.w) < 0 && (r = -r,
        t.x = -t.x,
        t.y = -t.y,
        t.z = -t.z,
        t.w = -t.w),
        l = .9995 < r ? (d = o,
        n) : (a = Math.cos(r),
        s = Math.sin(a),
        d = Math.sin(o * a) / s,
        Math.sin(n * a) / s),
        c.x = t.x * l + c.x * d,
        c.y = t.y * l + c.y * d,
        c.z = t.z * l + c.z * d,
        c.w = t.w * l + c.w * d,
        this.arUtilQuatNorm(c)),
        (this.filterQuaternionInfo = e).q
    }
    ,
    this.arFilterQuaternionInit = function() {
        if (this.filterQuaternionInfo) {
            var e = this.filterQuaternionInfo.q || new THREE.Quaternion;
            e.x = 0,
            e.y = 0,
            e.z = 0,
            e.w = 1,
            this.filterQuaternionInfo.q = e,
            this.arFilterQuaternionSetParams(this.filterQuaternionInfo, 10, 2) < 0 && (this.filterQuaternionInfo = null)
        }
        return this.filterQuaternionInfo
    }
    ,
    this.arFilterQuaternionInit()
}