import * as THREE from 'three';
import { getLenisInstance, destroyLenisInstance } from './smoothScroll';

export default class SketchManager {
    constructor(options) {
        this.container = options.domElement;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.isActive = true;

        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 100, 2000);
        this.camera.position.z = 600;
        this.camera.fov = 2 * Math.atan((this.height / 2) / 600) * 180 / Math.PI;

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);
        this.renderer.setSize(this.width, this.height);

        // Lenis setup
        this.smoothScroll = getLenisInstance();

        // Common properties
        this.time = 0;
        this.prevScrollPos = 0;
        this.scrollSpeed = 0;

        // Bind methods
        this.resize = this.resize.bind(this);
        this.render = this.render.bind(this);

        // Setup resize listener
        this.setupResize();
    }

    setupResize() {
        window.addEventListener('resize', this.resize);
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
    }

    update() {
        // Placeholder for child classes to override
    }

    render() {
        if (!this.isActive) return;
        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        this.isActive = false;
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
        destroyLenisInstance();
        window.removeEventListener('resize', this.resize);
    }
}