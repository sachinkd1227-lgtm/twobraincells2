/**
 * TwoBrainCells - Advanced 3D Luxury Jhumka Engine
 * Powered by Three.js with realistic PBR materials, procedural filigree textures,
 * interactive 360 turntable, macro interior inspection, and camera storytelling.
 */

class LuxuryJhumkaViewer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.warn(`Container #${containerId} not found.`);
            return;
        }

        this.options = Object.assign({
            autoRotate: true,
            autoRotateSpeed: 0.006,
            enableZoom: true,
            enablePan: false,
            initialView: 'overview',
            metalType: 'yellow-gold', // yellow-gold, rose-gold, white-gold, antique-gold
            gemType: 'emerald',      // emerald, ruby, diamond, sapphire
            showParticles: true,
            interactive: true,
            fov: 38
        }, options);

        this.width = this.container.clientWidth || 600;
        this.height = this.container.clientHeight || 600;

        this.isInteracting = false;
        this.isMouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetRotationX = 0;
        this.targetRotationY = 0;
        this.currentRotationX = 0;
        this.currentRotationY = 0;

        // Camera target lerp
        this.targetCamPos = new THREE.Vector3(0, 0, 7.5);
        this.targetLookAt = new THREE.Vector3(0, 0, 0);
        this.currentLookAt = new THREE.Vector3(0, 0, 0);

        // Sway animation time
        this.clock = new THREE.Clock();

        this.init();
    }

    init() {
        // 1. Scene & Renderer
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(
            this.options.fov,
            this.width / this.height,
            0.1,
            100
        );
        this.camera.position.set(0, 0, 7.5);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.35;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Clear container and attach canvas
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.display = 'block';

        // 2. Generate Environment Texture for realistic reflections
        this.createEnvironmentMap();

        // 3. Setup Luxury Lighting
        this.setupLighting();

        // 4. Generate Materials
        this.createMaterials();

        // 5. Build Procedural 3D Jhumka Model
        this.buildJhumkaModel();

        // 6. Floating Gold Dust Particles
        if (this.options.showParticles) {
            this.createGoldDustParticles();
        }

        // 7. Event Listeners
        this.setupInteractions();

        // 8. Resize Observer
        this.setupResize();

        // 9. Start Animation Loop
        this.animate = this.animate.bind(this);
        this.animationId = requestAnimationFrame(this.animate);
    }

    createEnvironmentMap() {
        // Generate a high-contrast luxury studio reflection gradient
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Studio warm light gradient
        const grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#362b1b');
        grad.addColorStop(0.3, '#14120e');
        grad.addColorStop(0.5, '#070605');
        grad.addColorStop(0.8, '#1b1712');
        grad.addColorStop(1, '#3b2f1f');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 256);

        // Softbox highlights
        ctx.fillStyle = 'rgba(255, 240, 210, 0.45)';
        ctx.beginPath();
        ctx.arc(120, 80, 50, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.arc(380, 100, 60, 0, Math.PI * 2);
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.envTexture = texture;
        this.scene.environment = this.envTexture;
    }

    setupLighting() {
        // Ambient soft fill
        const ambient = new THREE.AmbientLight(0xfff7e6, 0.9);
        this.scene.add(ambient);

        // Key Light (Warm Champagne Gold)
        this.keyLight = new THREE.DirectionalLight(0xffecd0, 2.2);
        this.keyLight.position.set(4, 6, 5);
        this.keyLight.castShadow = true;
        this.keyLight.shadow.mapSize.width = 1024;
        this.keyLight.shadow.mapSize.height = 1024;
        this.scene.add(this.keyLight);

        // Rim Light (High reflection contrast)
        this.rimLight = new THREE.DirectionalLight(0xd4af37, 2.5);
        this.rimLight.position.set(-5, 3, -4);
        this.scene.add(this.rimLight);

        // Under-Bell Upward Glow (Illuminates intricate interior craftsmanship)
        this.interiorLight = new THREE.PointLight(0xffd580, 2.4, 6);
        this.interiorLight.position.set(0, -2.5, 0);
        this.scene.add(this.interiorLight);

        // Sparkle Point Light
        this.sparkleLight = new THREE.PointLight(0xffffff, 1.2, 8);
        this.sparkleLight.position.set(0, 2.2, 2.5);
        this.scene.add(this.sparkleLight);
    }

    createMaterials() {
        // Generate procedural filigree bump map for realistic gold relief
        const bumpCanvas = document.createElement('canvas');
        bumpCanvas.width = 512;
        bumpCanvas.height = 512;
        const bCtx = bumpCanvas.getContext('2d');
        bCtx.fillStyle = '#808080';
        bCtx.fillRect(0, 0, 512, 512);

        // Ornate filigree floral patterns & micro-beading
        bCtx.strokeStyle = '#ffffff';
        bCtx.lineWidth = 4;
        for (let y = 0; y < 512; y += 40) {
            bCtx.beginPath();
            for (let x = 0; x < 512; x += 30) {
                bCtx.arc(x + 15, y + 20, 12, 0, Math.PI);
                bCtx.stroke();
            }
        }
        // Micro dots
        bCtx.fillStyle = '#ffffff';
        for (let i = 0; i < 400; i++) {
            const rx = Math.random() * 512;
            const ry = Math.random() * 512;
            bCtx.beginPath();
            bCtx.arc(rx, ry, 2, 0, Math.PI * 2);
            bCtx.fill();
        }

        const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
        bumpTexture.wrapS = THREE.RepeatWrapping;
        bumpTexture.wrapT = THREE.RepeatWrapping;
        bumpTexture.repeat.set(4, 4);

        // Metal color definitions
        const metalConfigs = {
            'yellow-gold': { color: 0xF3C352, metalness: 0.94, roughness: 0.22, clearcoat: 0.4 },
            'rose-gold': { color: 0xE8A293, metalness: 0.92, roughness: 0.20, clearcoat: 0.45 },
            'white-gold': { color: 0xEEF0F2, metalness: 0.96, roughness: 0.16, clearcoat: 0.5 },
            'antique-gold': { color: 0xB38838, metalness: 0.88, roughness: 0.42, clearcoat: 0.15 }
        };

        const currentMetal = metalConfigs[this.options.metalType] || metalConfigs['yellow-gold'];

        // 1. Primary Gold Material
        this.goldMat = new THREE.MeshPhysicalMaterial({
            color: currentMetal.color,
            metalness: currentMetal.metalness,
            roughness: currentMetal.roughness,
            clearcoat: currentMetal.clearcoat,
            clearcoatRoughness: 0.15,
            reflectivity: 0.95,
            bumpMap: bumpTexture,
            bumpScale: 0.04,
            envMapIntensity: 1.8
        });

        // 2. High-Polished Gold Material (for smooth bands, rims, wire links)
        this.polishedGoldMat = new THREE.MeshPhysicalMaterial({
            color: currentMetal.color,
            metalness: currentMetal.metalness,
            roughness: 0.12,
            clearcoat: 0.6,
            reflectivity: 1.0,
            envMapIntensity: 2.2
        });

        // 3. Antique Enamel Inner Ceiling (Meenakari inside the jhumka bell)
        this.enamelMat = new THREE.MeshStandardMaterial({
            color: 0x8a1824, // Royal crimson enamel
            roughness: 0.25,
            metalness: 0.3
        });

        // 4. Natural Basra Pearl Material
        this.pearlMat = new THREE.MeshPhysicalMaterial({
            color: 0xFBF8F1,
            roughness: 0.3,
            metalness: 0.05,
            clearcoat: 0.85,
            clearcoatRoughness: 0.25,
            reflectivity: 0.8,
            envMapIntensity: 1.2
        });

        // 5. Gemstone Materials
        this.createGemMaterial(this.options.gemType);

        // 6. Polki Diamond Facet Material
        this.polkiMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            roughness: 0.05,
            metalness: 0.15,
            transmission: 0.65,
            ior: 2.4,
            reflectivity: 1.0,
            clearcoat: 1.0,
            envMapIntensity: 2.5
        });
    }

    createGemMaterial(type) {
        let color = 0x0E7D46; // emerald
        if (type === 'ruby') color = 0xA8112C;
        else if (type === 'diamond') color = 0xEFF7FC;
        else if (type === 'sapphire') color = 0x14347A;

        if (!this.gemMat) {
            this.gemMat = new THREE.MeshPhysicalMaterial({
                color: color,
                roughness: 0.08,
                metalness: 0.1,
                transmission: 0.6,
                ior: 2.1,
                clearcoat: 0.9,
                reflectivity: 0.95,
                envMapIntensity: 2.2
            });
        } else {
            this.gemMat.color.setHex(color);
        }
    }

    buildJhumkaModel() {
        this.jhumkaRoot = new THREE.Group();
        this.scene.add(this.jhumkaRoot);

        // --- 1. Top Kundan Stud (Floral Rosette Medallion) ---
        this.topStud = new THREE.Group();
        this.topStud.position.y = 2.1;

        // Central Bezel & Gemstone
        const centerGemGeo = new THREE.CylinderGeometry(0.35, 0.3, 0.15, 8);
        const centerGem = new THREE.Mesh(centerGemGeo, this.gemMat);
        centerGem.rotation.x = Math.PI / 2;
        centerGem.position.z = 0.06;
        this.topStud.add(centerGem);

        const centerBezelGeo = new THREE.TorusGeometry(0.36, 0.06, 16, 32);
        const centerBezel = new THREE.Mesh(centerBezelGeo, this.polishedGoldMat);
        this.topStud.add(centerBezel);

        // Surrounding 8 Petals (Polki Diamonds in Gold Bezels)
        const petalCount = 8;
        const petalRadius = 0.55;
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            const px = Math.cos(angle) * petalRadius;
            const py = Math.sin(angle) * petalRadius;

            // Petal Gold Cup
            const cupGeo = new THREE.SphereGeometry(0.16, 12, 12);
            cupGeo.scale(1, 1, 0.6);
            const cup = new THREE.Mesh(cupGeo, this.goldMat);
            cup.position.set(px, py, 0.02);
            this.topStud.add(cup);

            // Petal Polki Stone
            const polkiGeo = new THREE.OctahedronGeometry(0.11, 0);
            polkiGeo.scale(1, 1, 0.5);
            const polki = new THREE.Mesh(polkiGeo, this.polkiMat);
            polki.position.set(px, py, 0.07);
            this.topStud.add(polki);
        }

        // Outer Beaded Halo (Milgrain Wire)
        const haloBeads = 32;
        const haloRadius = 0.82;
        for (let i = 0; i < haloBeads; i++) {
            const angle = (i / haloBeads) * Math.PI * 2;
            const bx = Math.cos(angle) * haloRadius;
            const by = Math.sin(angle) * haloRadius;
            const bead = new THREE.Mesh(
                new THREE.SphereGeometry(0.045, 8, 8),
                this.polishedGoldMat
            );
            bead.position.set(bx, by, 0);
            this.topStud.add(bead);
        }

        // Top Stud Earring Post & Backing Loop
        const studLoopGeo = new THREE.TorusGeometry(0.12, 0.03, 12, 24);
        const studLoop = new THREE.Mesh(studLoopGeo, this.polishedGoldMat);
        studLoop.position.set(0, -0.92, 0);
        this.topStud.add(studLoop);

        this.jhumkaRoot.add(this.topStud);

        // --- 2. Central Articulated Connector ---
        this.connector = new THREE.Group();
        this.connector.position.y = 0.95;

        // Linking Ring
        const linkRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.14, 0.035, 12, 24),
            this.polishedGoldMat
        );
        linkRing.rotation.y = Math.PI / 2;
        this.connector.add(linkRing);

        // Center Gold Spacer Bead
        const spacer = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.25, 0.25, 16),
            this.goldMat
        );
        spacer.position.y = -0.15;
        this.connector.add(spacer);

        this.jhumkaRoot.add(this.connector);

        // --- 3. The Sculptural Jhumka Bell Dome ---
        this.bellDome = new THREE.Group();
        this.bellDome.position.y = -0.1;

        // Elegant Bell Lathe Profile
        const points = [];
        points.push(new THREE.Vector2(0.15, 0.85)); // Top cap apex
        points.push(new THREE.Vector2(0.35, 0.75));
        points.push(new THREE.Vector2(0.65, 0.55));
        points.push(new THREE.Vector2(0.95, 0.30));
        points.push(new THREE.Vector2(1.25, 0.00));
        points.push(new THREE.Vector2(1.48, -0.35));
        points.push(new THREE.Vector2(1.55, -0.75)); // Flared waist
        points.push(new THREE.Vector2(1.60, -1.05)); // Scalloped skirt edge
        // Hollow interior thickness
        points.push(new THREE.Vector2(1.46, -1.05));
        points.push(new THREE.Vector2(1.40, -0.75));
        points.push(new THREE.Vector2(1.10, -0.10));
        points.push(new THREE.Vector2(0.70, 0.35));
        points.push(new THREE.Vector2(0.20, 0.70));
        points.push(new THREE.Vector2(0.08, 0.80)); // Inner apex

        const bellGeo = new THREE.LatheGeometry(points, 48);
        this.bellMesh = new THREE.Mesh(bellGeo, this.goldMat);
        this.bellMesh.castShadow = true;
        this.bellMesh.receiveShadow = true;
        this.bellDome.add(this.bellMesh);

        // Inner Ceiling Meenakari Enamel Dome (visible when looking inside!)
        const innerPoints = [];
        innerPoints.push(new THREE.Vector2(0.05, 0.78));
        innerPoints.push(new THREE.Vector2(0.68, 0.33));
        innerPoints.push(new THREE.Vector2(1.08, -0.12));
        innerPoints.push(new THREE.Vector2(1.36, -0.73));
        innerPoints.push(new THREE.Vector2(1.42, -1.02));
        const innerCeilingGeo = new THREE.LatheGeometry(innerPoints, 32);
        const innerCeiling = new THREE.Mesh(innerCeilingGeo, this.enamelMat);
        this.bellDome.add(innerCeiling);

        // Exterior Concentric Decorative Relief Rings
        const ring1 = new THREE.Mesh(
            new THREE.TorusGeometry(0.75, 0.05, 12, 36),
            this.polishedGoldMat
        );
        ring1.rotation.x = Math.PI / 2;
        ring1.position.y = 0.45;
        this.bellDome.add(ring1);

        const ring2 = new THREE.Mesh(
            new THREE.TorusGeometry(1.35, 0.055, 12, 42),
            this.polishedGoldMat
        );
        ring2.rotation.x = Math.PI / 2;
        ring2.position.y = -0.1;
        this.bellDome.add(ring2);

        // Waist Band with 20 Inset Polki Diamonds
        const waistBeadCount = 20;
        const waistRadius = 1.58;
        for (let i = 0; i < waistBeadCount; i++) {
            const angle = (i / waistBeadCount) * Math.PI * 2;
            const wx = Math.cos(angle) * waistRadius;
            const wz = Math.sin(angle) * waistRadius;

            // Gold cup
            const wCup = new THREE.Mesh(
                new THREE.SphereGeometry(0.09, 8, 8),
                this.goldMat
            );
            wCup.position.set(wx, -0.65, wz);
            this.bellDome.add(wCup);

            // Inset Polki facet
            const wPolki = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.065, 0),
                (i % 2 === 0) ? this.polkiMat : this.gemMat
            );
            wPolki.position.set(wx * 1.03, -0.65, wz * 1.03);
            this.bellDome.add(wPolki);
        }

        // --- 4. The Interior Clapper & Dangling Pearl Drop ---
        // Inside the bell cavity: a gold chain suspends an inner Basra pearl droplet
        this.interiorClapper = new THREE.Group();
        this.interiorClapper.position.set(0, 0.65, 0);

        // Clapper suspension rod
        const clapperRodGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.1, 8);
        const clapperRod = new THREE.Mesh(clapperRodGeo, this.polishedGoldMat);
        clapperRod.position.y = -0.55;
        this.interiorClapper.add(clapperRod);

        // Inner Gold Bead
        const clapperBead = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 12, 12),
            this.goldMat
        );
        clapperBead.position.y = -1.15;
        this.interiorClapper.add(clapperBead);

        // Inner Natural Teardrop Pearl
        const pearlTeardropGeo = new THREE.SphereGeometry(0.22, 16, 16);
        pearlTeardropGeo.scale(0.85, 1.35, 0.85);
        const innerPearl = new THREE.Mesh(pearlTeardropGeo, this.pearlMat);
        innerPearl.position.y = -1.45;
        this.interiorClapper.add(innerPearl);

        this.bellDome.add(this.interiorClapper);

        // --- 5. Cascading Rim Ghungroos & Basra Pearl Tassels ---
        this.tasselsGroup = new THREE.Group();
        this.tassels = [];
        const tasselCount = 24;
        const skirtRadius = 1.58;
        const skirtY = -1.05;

        for (let i = 0; i < tasselCount; i++) {
            const angle = (i / tasselCount) * Math.PI * 2;
            const tx = Math.cos(angle) * skirtRadius;
            const tz = Math.sin(angle) * skirtRadius;

            const tasselAnchor = new THREE.Group();
            tasselAnchor.position.set(tx, skirtY, tz);

            // Eyelet loop on rim
            const eyelet = new THREE.Mesh(
                new THREE.TorusGeometry(0.05, 0.015, 8, 16),
                this.polishedGoldMat
            );
            eyelet.rotation.y = angle;
            tasselAnchor.add(eyelet);

            // Dangling Wire & Pearl
            const wireGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.28, 6);
            const wire = new THREE.Mesh(wireGeo, this.polishedGoldMat);
            wire.position.y = -0.16;
            tasselAnchor.add(wire);

            // Miniature Gold Spacer Bead
            const bead = new THREE.Mesh(
                new THREE.SphereGeometry(0.045, 8, 8),
                this.goldMat
            );
            bead.position.y = -0.32;
            tasselAnchor.add(bead);

            // Natural Basra Seed Pearl Droplet
            const pearlDropGeo = new THREE.SphereGeometry(0.12, 14, 14);
            pearlDropGeo.scale(0.9, 1.25, 0.9);
            const pearl = new THREE.Mesh(pearlDropGeo, this.pearlMat);
            pearl.position.y = -0.52;
            tasselAnchor.add(pearl);

            this.tasselsGroup.add(tasselAnchor);
            this.tassels.push({
                group: tasselAnchor,
                phase: angle * 2,
                baseY: skirtY
            });
        }

        this.bellDome.add(this.tasselsGroup);
        this.jhumkaRoot.add(this.bellDome);

        // Center root slightly
        this.jhumkaRoot.position.y = -0.3;
    }

    createGoldDustParticles() {
        const particleCount = 140;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const scales = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 8;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
            scales[i] = Math.random() * 0.08 + 0.02;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

        // Circular sparkle particle texture
        const pCanvas = document.createElement('canvas');
        pCanvas.width = 64;
        pCanvas.height = 64;
        const pCtx = pCanvas.getContext('2d');
        const pGrad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
        pGrad.addColorStop(0, 'rgba(255, 235, 170, 1)');
        pGrad.addColorStop(0.3, 'rgba(218, 165, 32, 0.8)');
        pGrad.addColorStop(0.8, 'rgba(218, 165, 32, 0.15)');
        pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        pCtx.fillStyle = pGrad;
        pCtx.fillRect(0, 0, 64, 64);

        const pTexture = new THREE.CanvasTexture(pCanvas);

        const pMaterial = new THREE.PointsMaterial({
            size: 0.22,
            map: pTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, pMaterial);
        this.scene.add(this.particles);
    }

    setupInteractions() {
        if (!this.options.interactive) return;

        const el = this.renderer.domElement;

        const onPointerDown = (e) => {
            this.isMouseDown = true;
            this.isInteracting = true;
            this.mouseX = e.clientX || (e.touches && e.touches[0].clientX);
            this.mouseY = e.clientY || (e.touches && e.touches[0].clientY);
        };

        const onPointerMove = (e) => {
            if (!this.isMouseDown) return;
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);

            const deltaX = clientX - this.mouseX;
            const deltaY = clientY - this.mouseY;

            this.targetRotationY += deltaX * 0.009;
            this.targetRotationX += deltaY * 0.007;

            // Clamping vertical pitch to prevent inversion
            this.targetRotationX = Math.max(-0.8, Math.min(0.9, this.targetRotationX));

            this.mouseX = clientX;
            this.mouseY = clientY;
        };

        const onPointerUp = () => {
            this.isMouseDown = false;
            // Allow auto-rotate to resume gently after 3s of inactivity
            clearTimeout(this.resumeTimer);
            this.resumeTimer = setTimeout(() => {
                this.isInteracting = false;
            }, 3000);
        };

        // Scroll zoom inside canvas
        const onWheel = (e) => {
            if (!this.options.enableZoom) return;
            e.preventDefault();
            const zoomDelta = e.deltaY * 0.003;
            const currentDist = this.targetCamPos.length();
            const newDist = Math.max(2.4, Math.min(10.0, currentDist + zoomDelta));
            this.targetCamPos.normalize().multiplyScalar(newDist);
        };

        el.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);

        el.addEventListener('touchstart', onPointerDown, { passive: true });
        window.addEventListener('touchmove', onPointerMove, { passive: true });
        window.addEventListener('touchend', onPointerUp);

        el.addEventListener('wheel', onWheel, { passive: false });
    }

    setupResize() {
        this.resizeObserver = new ResizeObserver(() => {
            if (!this.container) return;
            this.width = this.container.clientWidth;
            this.height = this.container.clientHeight;

            if (this.width === 0 || this.height === 0) return;

            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.width, this.height);
        });

        this.resizeObserver.observe(this.container);
    }

    /**
     * Camera Presets for Macro & Interior Storytelling
     */
    setCameraPreset(presetName, duration = 1.4) {
        let targetPos = new THREE.Vector3(0, 0, 7.5);
        let targetLook = new THREE.Vector3(0, 0, 0);
        let targetPitch = 0;
        let targetYaw = 0;

        switch (presetName) {
            case 'overview':
                targetPos.set(0, 0, 7.5);
                targetLook.set(0, 0, 0);
                targetPitch = 0;
                targetYaw = this.targetRotationY;
                break;

            case 'macro-stud':
                // Close-up on the Kundan Polki Crown
                targetPos.set(0, 2.2, 2.5);
                targetLook.set(0, 1.8, 0);
                targetPitch = 0.05;
                break;

            case 'macro-jali':
                // Close-up on the Hand-Pierced Filigree Dome
                targetPos.set(0.9, -0.3, 2.7);
                targetLook.set(0, -0.4, 0);
                targetPitch = -0.1;
                break;

            case 'inside-bell':
                // Looking UP into the bell cavity showing inner meenakari ceiling and suspended pearl clapper
                targetPos.set(0, -3.2, 1.8);
                targetLook.set(0, -0.6, 0);
                targetPitch = -0.65; // Tilt up to gaze directly inside
                break;

            case 'macro-pearls':
                // Close-up on the Basra Pearl Tassels fringe
                targetPos.set(0.4, -1.9, 2.6);
                targetLook.set(0, -1.4, 0);
                targetPitch = 0.15;
                break;
        }

        if (window.gsap) {
            gsap.to(this.targetCamPos, {
                x: targetPos.x,
                y: targetPos.y,
                z: targetPos.z,
                duration: duration,
                ease: "power2.inOut"
            });
            gsap.to(this.targetLookAt, {
                x: targetLook.x,
                y: targetLook.y,
                z: targetLook.z,
                duration: duration,
                ease: "power2.inOut"
            });
            gsap.to(this, {
                targetRotationX: targetPitch,
                duration: duration,
                ease: "power2.inOut"
            });
        } else {
            this.targetCamPos.copy(targetPos);
            this.targetLookAt.copy(targetLook);
            this.targetRotationX = targetPitch;
        }
    }

    /**
     * Switch Metal Finish (Yellow Gold, Rose Gold, White Gold, Antique Gold)
     */
    setMetal(type) {
        this.options.metalType = type;
        const metalConfigs = {
            'yellow-gold': { color: 0xF3C352, metalness: 0.94, roughness: 0.22, clearcoat: 0.4 },
            'rose-gold': { color: 0xE8A293, metalness: 0.92, roughness: 0.20, clearcoat: 0.45 },
            'white-gold': { color: 0xEEF0F2, metalness: 0.96, roughness: 0.16, clearcoat: 0.5 },
            'antique-gold': { color: 0xB38838, metalness: 0.88, roughness: 0.42, clearcoat: 0.15 }
        };

        const config = metalConfigs[type] || metalConfigs['yellow-gold'];

        if (this.goldMat) {
            this.goldMat.color.setHex(config.color);
            this.goldMat.metalness = config.metalness;
            this.goldMat.roughness = config.roughness;
            this.goldMat.clearcoat = config.clearcoat;
            this.goldMat.needsUpdate = true;
        }

        if (this.polishedGoldMat) {
            this.polishedGoldMat.color.setHex(config.color);
            this.polishedGoldMat.metalness = config.metalness;
            this.polishedGoldMat.needsUpdate = true;
        }
    }

    /**
     * Switch Gemstone (Emerald, Ruby, Diamond, Sapphire)
     */
    setGemstone(type) {
        this.options.gemType = type;
        this.createGemMaterial(type);
    }

    /**
     * Switch Studio Lighting Atmosphere
     */
    setLightingMode(mode) {
        if (!this.keyLight || !this.rimLight) return;

        switch (mode) {
            case 'warm':
                this.keyLight.color.setHex(0xffecd0);
                this.keyLight.intensity = 2.4;
                this.rimLight.color.setHex(0xd4af37);
                this.renderer.toneMappingExposure = 1.35;
                break;
            case 'sunset':
                this.keyLight.color.setHex(0xffaa5e);
                this.keyLight.intensity = 2.8;
                this.rimLight.color.setHex(0xeb6b47);
                this.renderer.toneMappingExposure = 1.45;
                break;
            case 'midnight':
                this.keyLight.color.setHex(0x9fc5e8);
                this.keyLight.intensity = 1.8;
                this.rimLight.color.setHex(0xf1c40f);
                this.renderer.toneMappingExposure = 1.2;
                break;
            case 'sparkle':
                this.keyLight.color.setHex(0xffffff);
                this.keyLight.intensity = 3.2;
                this.rimLight.color.setHex(0xfff1c5);
                this.renderer.toneMappingExposure = 1.5;
                break;
        }
    }

    animate() {
        this.animationId = requestAnimationFrame(this.animate);

        const delta = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();

        // Auto-rotation when idle
        if (this.options.autoRotate && !this.isInteracting) {
            this.targetRotationY += this.options.autoRotateSpeed;
        }

        // Smooth rotation damping
        this.currentRotationX += (this.targetRotationX - this.currentRotationX) * 0.08;
        this.currentRotationY += (this.targetRotationY - this.currentRotationY) * 0.08;

        if (this.jhumkaRoot) {
            this.jhumkaRoot.rotation.x = this.currentRotationX;
            this.jhumkaRoot.rotation.y = this.currentRotationY;

            // Subtle levitating float
            this.jhumkaRoot.position.y = -0.3 + Math.sin(elapsedTime * 1.5) * 0.04;
        }

        // Swaying pearl tassels physics simulation
        if (this.tassels && this.tassels.length) {
            const rotSpeed = Math.abs(this.targetRotationY - this.currentRotationY);
            for (let i = 0; i < this.tassels.length; i++) {
                const item = this.tassels[i];
                const sway = Math.sin(elapsedTime * 3.5 + item.phase) * (0.05 + rotSpeed * 0.25);
                item.group.rotation.z = sway;
            }
        }

        // Interior Clapper delicate swinging
        if (this.interiorClapper) {
            const clapperSway = Math.sin(elapsedTime * 2.8) * 0.08;
            this.interiorClapper.rotation.z = clapperSway;
        }

        // Floating Gold Dust drift
        if (this.particles) {
            this.particles.rotation.y = elapsedTime * 0.02;
            this.particles.rotation.x = Math.sin(elapsedTime * 0.03) * 0.05;
        }

        // Camera smooth position & lookAt lerping
        this.camera.position.lerp(this.targetCamPos, 0.06);
        this.currentLookAt.lerp(this.targetLookAt, 0.06);
        this.camera.lookAt(this.currentLookAt);

        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
    }
}

window.LuxuryJhumkaViewer = LuxuryJhumkaViewer;
