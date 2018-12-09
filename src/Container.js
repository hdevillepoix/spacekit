import { Camera } from './Camera';
import { Skybox } from './Skybox';
import { SpaceObject } from './SpaceObject';
import { SpaceParticles } from './SpaceParticles';

export class Container {
  // Wraps scene and controls and skybox in an animated container

  constructor(containerElt, options) {
    this._containerElt = containerElt;
    this._options = options || {};

    this._jed = this._options.jed || 0;

    this._scene = null;
    this._renderer = null;

    this._camera = null;
    this._cameraControls = null;

    this._subscribedObjects = {};
    this._particles = null;

    // stats.js panel
    this._stats = null;
    this._fps = 1;
    this._lastRenderedTime = Date.now();

    this.init();
    this.animate();
  }

  init() {
    this.initRenderer();

    // Scene
    this._scene = new THREE.Scene();

    // Camera
    this._camera = new Camera(this.getContext()).get3jsCamera();
    this._camera.position.set(0, -10, 5);
    window.cam = this._camera;

    // Controls
    this._cameraControls = new THREE.TrackballControls(this._camera, this._containerElt);
    this._cameraControls.userPanSpeed = 20;
    this._cameraControls.rotateSpeed = 2;

    // Helper
    if (this._options.debug) {
      if (this._options.debug.showAxesHelper) {
        this._scene.add(new THREE.AxesHelper(5));
      }
      if (this._options.debug.showStats) {
        this._stats = new Stats();
        this._stats.showPanel(0);
        window.sssss = this._stats;
        this._containerElt.appendChild(this._stats.dom);
      }
    }

    // Orbit particle system must be initialized after scene is created.
    this._particles = new SpaceParticles({
      textureUrl: '{{assets}}/sprites/smallparticle.png',
      jed: this._jed,
      maxNumParticles: this._options.maxNumParticles,
    }, this);
  }

  animate() {
    window.requestAnimationFrame(this.animate.bind(this));

    if (this._stats) {
      this._stats.begin();
    }

    if (this._options.jedDelta) {
      this._jed += this._options.jedDelta;
    } else {
      // N jed per second
      this._jed += (this._options.jedPerSecond || 10) / this._fps;
    }

    this.update();
    this._cameraControls.update();
    this._renderer.render(this._scene, this._camera);

    const timeDelta = (Date.now() - this._lastRenderedTime) / 1000;
    this._lastRenderedTime = Date.now();
    this._fps = (1 / timeDelta) || 1;

    if (this._stats) {
      this._stats.end();
    }
  }

  initRenderer() {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(this._containerElt.offsetWidth, this._containerElt.offsetHeight);

    this._containerElt.appendChild(renderer.domElement);

    this._renderer = renderer;
  }

  addObject(obj, noUpdate = false) {
    obj.get3jsObjects().map((x) => {
      this._scene.add(x);
    });

    if (!noUpdate) {
      // Call for updates as time passes.
      this._subscribedObjects[obj.getId()] = obj;
    }
  }

  removeObject(obj) {
    // TODO(ian): test this and avoid memory leaks...
    obj.get3jsObjects().map((x) => {
      this._scene.remove(x);
    });

    delete this._subscribedObjects[obj.getId()];
  }

  createObject(...args) {
    return new SpaceObject(...args, this);
  }

  createObjects(prefix, objects) {
    objects.forEach((obj, idx) => {

    });
  }

  createSkybox(...args) {
    return new Skybox(...args, this);
  }

  update() {
    for (const objId in this._subscribedObjects) {
      if (this._subscribedObjects.hasOwnProperty(objId)) {
        this._subscribedObjects[objId].update(this._jed);
      }
    }
  }

  getJed() {
    return this._jed;
  }

  setJed(val) {
    this._jed = val;
  }

  getContext() {
    return {
      options: this._options,
      objects: {
        particles: this._particles,
      },
      container: {
        width: this._containerElt.offsetWidth,
        height: this._containerElt.offsetHeight,
      },
    };
  }
}
