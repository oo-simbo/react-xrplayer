/**
 * 负责加载纹理资源
 * 支持：全景图片，全景视频（flv，hls，mp4格式）
 */
import Hls from 'hls.js';
import * as THREE from 'three';
import flvjs from 'flv.js/dist/flv.min.js';

class TextureHelper {

    /**
     * @param {video或者图片的载体} containerNode 
     * @param {加载资源的属性集合} resProps 
     */
    constructor(containerNode) {
        this.containerNode = containerNode;
        this.onLoadSuccessHandler = null;
        this.onLoadErrorHandler = null;
        this.videoLoader = null;
        this.resType = 'image'
    }

    initVideoNode = () => {
        this.containerNode.width = 0;
        this.containerNode.height = 0;
        this.containerNode.loop = true;
        this.containerNode.crossOrigin = "anonymous";
        this.containerNode.autoplay = true;
        this.containerNode.allowsInlineMediaPlayback = true;
        this.containerNode.setAttribute('webkit-playsinline', 'webkit-playsinline');
        this.containerNode.setAttribute('webkit-playsinline', true);
        this.containerNode.setAttribute('playsinline', true)
        this.containerNode.setAttribute('preload', 'auto')
        this.containerNode.setAttribute('x-webkit-airplay', 'allow')
        this.containerNode.setAttribute('x5-playsinline', true)
        this.containerNode.setAttribute('x5-video-player-type', 'h5')
        this.containerNode.setAttribute('x5-video-player-fullscreen', true)
        this.containerNode.setAttribute('x5-video-orientation', 'portrait')
        this.containerNode.setAttribute('style', 'object-fit: fill')
        this.containerNode.setAttribute('loop', "loop")
    }

    getTextureFromVideo = (video) => {
        let texture = new THREE.VideoTexture(video);
        texture.minFilter = THREE.LinearFilter;
        texture.format = THREE.RGBFormat;
        return texture;
    }

    loadFlvVideo = (resUrl) => {
        this.initVideoNode();
        if (flvjs.isSupported()) {
            let flvPlayer = flvjs.createPlayer({ type: 'flv', url: resUrl });
            this.videoLoader = flvPlayer;
            flvPlayer.attachMediaElement(this.containerNode);
            flvPlayer.load();
            flvPlayer.play();
        } else {
            console.error('Your browser does not support flvjs')
            this.onLoadErrorHandler('设备不支持FLV');
        }
        return this.getTextureFromVideo(this.containerNode);
    }

    loadHlsVideo = (resUrl) => {
        this.initVideoNode();
        if (Hls.isSupported()) {
            var hls = new Hls();
            this.videoLoader = hls;
            hls.loadSource(resUrl);
            hls.attachMedia(this.containerNode);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                this.containerNode.play();
                this.onLoadSuccessHandler();
            });
        } else {
            console.log('设备不支持HLS')
            this.onLoadErrorHandler('设备不支持HLS');
        }
        return this.getTextureFromVideo(this.containerNode);
    }

    loadMp4Video = (resUrl) => {
        this.initVideoNode();
        this.containerNode.src = resUrl;
        this.containerNode.load();
        this.containerNode.play();
        return this.getTextureFromVideo(this.containerNode);
    }

    loadImage = (resUrl) => {
        var texture = new THREE.TextureLoader().load(resUrl);
        return texture;
    }

    loadTexture = (resource) => {
        const { type, res_url } = resource;
        this.resType = type;
        switch (type) {
            case 'hls':
                return this.loadHlsVideo(res_url);
            case 'flv':
                return this.loadFlvVideo(res_url);
            case 'mp4':
                return this.loadMp4Video(res_url);
            case 'image':
                return this.loadImage(res_url);
            default:
                return null;
        }
    }

    startDisplay = () => {
        switch (this.resType) {
            case 'hls':
            case 'mp4':
                this.containerNode && this.containerNode.play();
                break;
            case 'flv':
                this.videoLoader && this.videoLoader.play();
                break;
            default:
                break;
        }
    }

    pauseDisplay = () => {
        switch (this.resType) {
            case 'hls':
            case 'mp4':
                this.containerNode && this.containerNode.pause();
                break;
            case 'flv':
                this.videoLoader && this.videoLoader.pause();
                break;
            default:
                break;
        }
    }

    unloadFlvVideo = () => {
        if (this.videoLoader) {
            this.videoLoader.unload();
            this.videoLoader.detachMediaElement();
        }
    }

    unloadHlsVideo = () => {
        if (this.videoLoader) {
            this.videoLoader.stopLoad();
            this.videoLoader.detachMedia();
            this.videoLoader.destroy();
        }
    }

    unloadResource = () => {
        switch (this.resType) {
            case 'hls':
                this.unloadHlsVideo();
                break;
            case 'flv':
                this.unloadFlvVideo();
                break;
            case 'mp4':
            case 'image':
                // TODO 是否需要释放资源？？
                break;
            default:
                return null;
        }
    }
}

export default TextureHelper;