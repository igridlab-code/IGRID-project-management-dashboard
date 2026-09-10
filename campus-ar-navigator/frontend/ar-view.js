/**
 * CampusAR Navigator — 3D WebAR Scene & Directional Arrow Controller
 * Implemented using Three.js overlay on WebRTC camera feed with compass fusion.
 * Features smooth delta-time lerp rotation, aerodynamic banking, and billboard text.
 */

class ARView {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // 3D Objects
    this.arrowGroup = null;
    this.arrowMesh = null;
    this.beaconGroup = null;
    this.distanceSprite = null;
    this.beaconOuterRing = null;
    this.beaconInnerRing = null;

    // Heading and Bearing State (in degrees [0, 360))
    this.deviceHeading = 0.0;     // Current compass heading (0 = North, 90 = East)
    this.targetBearing = 0.0;     // Bearing to next waypoint
    this.currentYaw = 0.0;        // Current smoothed yaw angle (radians)
    this.targetYaw = 0.0;         // Target yaw angle (radians)
    this.rollAngle = 0.0;         // Aerodynamic roll tilt angle (radians)

    this.activeWaypoint = null;
    this.userPos = { x: 0, y: 0 };
    this.currentDistance = 0.0;
    this.celebrationTime = 0.0;   // Trigger celebratory pulse

    this.initScene();
    this.create3DArrow();
    this.createGroundBeacon();
    this.setupOrientationSensors();
    this.onWindowResize();

    window.addEventListener('resize', () => this.onWindowResize());
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initScene() {
    this.scene = new THREE.Scene();

    // Perspective Camera: 68° FOV matches vertical phone camera nicely
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(68, aspect, 0.1, 500);
    this.camera.position.set(0, 1.25, 3.4); // Eye-level viewing position
    this.camera.lookAt(0, 0, 0);

    // Renderer with full alpha transparency
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Ambient and Directional Lights for AR highlights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f2fe, 1.3);
    dirLight.position.set(2, 5, 3);
    this.scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 1.2, 12);
    pointLight.position.set(0, 0.5, 1);
    this.scene.add(pointLight);
  }

  create3DArrow() {
    this.arrowGroup = new THREE.Group();

    // Arrow Material: Neon cyan with vibrant emissive glow
    const arrowMat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
      metalness: 0.25,
      roughness: 0.2
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.9
    });

    // 1. Arrow Head (Cone pointing forward along -Z)
    const coneGeom = new THREE.ConeGeometry(0.44, 0.95, 32);
    coneGeom.rotateX(-Math.PI / 2); // Tip points forward along -Z
    const coneMesh = new THREE.Mesh(coneGeom, arrowMat);
    coneMesh.position.set(0, 0, -0.68);
    this.arrowGroup.add(coneMesh);

    // 2. Arrow Shaft (Cylinder aligned along Z)
    const cylinderGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.95, 24);
    cylinderGeom.rotateX(Math.PI / 2);
    const cylinderMesh = new THREE.Mesh(cylinderGeom, arrowMat);
    cylinderMesh.position.set(0, 0, 0.15);
    this.arrowGroup.add(cylinderMesh);

    // 3. Glowing Cyber Rings around shaft
    const ringGeom = new THREE.TorusGeometry(0.25, 0.035, 16, 32);
    const ring1 = new THREE.Mesh(ringGeom, accentMat);
    ring1.position.set(0, 0, -0.05);
    this.arrowGroup.add(ring1);

    const ring2 = new THREE.Mesh(ringGeom, accentMat);
    ring2.position.set(0, 0, 0.35);
    this.arrowGroup.add(ring2);

    // 4. Floating Distance Label Sprite
    this.distanceSprite = this.createTextSprite("CampusAR Ready");
    this.distanceSprite.position.set(0, 0.9, 0);
    this.arrowGroup.add(this.distanceSprite);

    this.scene.add(this.arrowGroup);
  }

  createGroundBeacon() {
    this.beaconGroup = new THREE.Group();

    const ringGeom = new THREE.RingGeometry(0.65, 0.82, 36);
    ringGeom.rotateX(-Math.PI / 2);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });

    const innerRingGeom = new THREE.RingGeometry(0.2, 0.38, 36);
    innerRingGeom.rotateX(-Math.PI / 2);
    const innerBeaconMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    });

    this.beaconOuterRing = new THREE.Mesh(ringGeom, beaconMat);
    this.beaconInnerRing = new THREE.Mesh(innerRingGeom, innerBeaconMat);

    this.beaconGroup.add(this.beaconOuterRing);
    this.beaconGroup.add(this.beaconInnerRing);
    this.beaconGroup.position.set(0, -1.2, -0.5);

    this.scene.add(this.beaconGroup);
  }

  createTextSprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    this.updateCanvasText(ctx, canvas.width, canvas.height, text);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.4, 0.6, 1.0);
    sprite._canvas = canvas;
    sprite._ctx = ctx;
    sprite._texture = texture;
    return sprite;
  }

  updateCanvasText(ctx, width, height, text) {
    ctx.clearRect(0, 0, width, height);

    // Rounded background pill
    ctx.fillStyle = 'rgba(10, 16, 32, 0.9)';
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.8)';
    ctx.lineWidth = 4;

    const r = 26;
    const pad = 6;
    ctx.beginPath();
    ctx.moveTo(pad + r, pad);
    ctx.lineTo(width - pad - r, pad);
    ctx.quadraticCurveTo(width - pad, pad, width - pad, pad + r);
    ctx.lineTo(width - pad, height - pad - r);
    ctx.quadraticCurveTo(width - pad, height - pad, width - pad - r, height - pad);
    ctx.lineTo(pad + r, height - pad);
    ctx.quadraticCurveTo(pad, height - pad, pad, height - pad - r);
    ctx.lineTo(pad, pad + r);
    ctx.quadraticCurveTo(pad, pad, pad + r, pad);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Text label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Inter", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
  }

  setWaypointTarget(waypoint, userPos) {
    this.activeWaypoint = waypoint;
    if (userPos) this.userPos = userPos;

    if (!waypoint) {
      this.currentDistance = 0;
      if (this.distanceSprite) {
        this.updateCanvasText(
          this.distanceSprite._ctx,
          this.distanceSprite._canvas.width,
          this.distanceSprite._canvas.height,
          "Select Destination"
        );
        this.distanceSprite._texture.needsUpdate = true;
      }
      return;
    }

    // Calculate bearing from user to waypoint
    const dx = waypoint.x - this.userPos.x;
    const dy = waypoint.y - this.userPos.y;
    const dist = Math.hypot(dx, dy);
    this.currentDistance = dist;

    // Bearing: 0° is North (dy > 0), 90° is East (dx > 0)
    let bearingDeg = (Math.atan2(dx, dy) * (180 / Math.PI) + 360) % 360;
    this.targetBearing = bearingDeg;

    // Update floating distance banner in 3D
    const label = `${Math.round(dist)}m ➔ ${waypoint.name.substring(0, 16)}`;
    if (this.distanceSprite) {
      this.updateCanvasText(
        this.distanceSprite._ctx,
        this.distanceSprite._canvas.width,
        this.distanceSprite._canvas.height,
        label
      );
      this.distanceSprite._texture.needsUpdate = true;
    }
  }

  triggerArrivalCelebration() {
    this.celebrationTime = 2.5; // 2.5 seconds celebration burst
    if (this.beaconOuterRing) {
      this.beaconOuterRing.material.color.setHex(0xf59e0b); // Gold pulse
    }
  }

  setupOrientationSensors() {
    const handleOrientation = (event) => {
      let heading = null;

      if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
        // iOS Safari gives direct compass heading in degrees [0, 360)
        heading = event.webkitCompassHeading;
      } else if (event.alpha !== null && event.alpha !== undefined) {
        // Android / Chrome: alpha is rotation around Z axis
        heading = (360 - event.alpha) % 360;
      }

      if (heading !== null && !isNaN(heading)) {
        this.setDeviceHeading(heading);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    }
  }

  setDeviceHeading(deg) {
    this.deviceHeading = (deg + 360) % 360;
    const headingDisplay = document.getElementById('heading-display');
    if (headingDisplay) {
      const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const cardIdx = Math.round(this.deviceHeading / 45) % 8;
      const card = cardinals[cardIdx];
      headingDisplay.textContent = `${Math.round(this.deviceHeading).toString().padStart(3, '0')}° ${card}`;
    }
  }

  onWindowResize() {
    if (!this.renderer || !this.camera) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.1); // clamp delta time for stability
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Arrow Floating Bobbing Animation
    if (this.arrowGroup) {
      const bobHeight = Math.sin(elapsedTime * 2.8) * 0.13;
      this.arrowGroup.position.y = bobHeight;

      // 2. Smooth Lerp Rotation toward Target Bearing:
      // deltaAngle = shortest angle difference in [-180, 180]
      let deltaAngle = (this.targetBearing - this.deviceHeading + 540) % 360 - 180;
      const targetYawRad = -deltaAngle * (Math.PI / 180);

      // Shortest circular angular difference
      let diff = targetYawRad - this.currentYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      // Exponential damping (smooth lerp toward target bearing)
      const lerpSpeed = 7.5; // 7.5 Hz smoothing rate
      const step = 1.0 - Math.exp(-lerpSpeed * dt);
      this.currentYaw += diff * step;
      this.arrowGroup.rotation.y = this.currentYaw;

      // 3. Aerodynamic banking roll:
      // When the arrow turns rapidly, gently roll into the turn
      const targetRoll = THREE.MathUtils.clamp(-diff * 0.5, -0.35, 0.35);
      this.rollAngle += (targetRoll - this.rollAngle) * Math.min(1.0, 10.0 * dt);
      this.arrowGroup.rotation.z = this.rollAngle;

      // Subtle pitch tilt breathing
      this.arrowGroup.rotation.x = Math.sin(elapsedTime * 1.5) * 0.035;
    }

    // 4. Ground Beacon Animation
    if (this.beaconGroup) {
      if (this.celebrationTime > 0) {
        this.celebrationTime -= dt;
        const pulseScale = 1.0 + Math.sin(elapsedTime * 12.0) * 0.35;
        this.beaconOuterRing.scale.set(pulseScale, pulseScale, 1);
        if (this.celebrationTime <= 0 && this.beaconOuterRing) {
          this.beaconOuterRing.material.color.setHex(0x00f2fe);
        }
      } else {
        const scale = 1.0 + Math.sin(elapsedTime * 3.2) * 0.12;
        this.beaconOuterRing.scale.set(scale, scale, 1);
      }
      this.beaconInnerRing.rotation.z = elapsedTime * 0.7;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Export for usage in app.js
window.ARView = ARView;
