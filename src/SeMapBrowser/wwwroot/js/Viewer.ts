/// <reference path="three.d.ts"/>
/// <reference path="detector.d.ts"/>
/// <reference path="OrbitControls.d.ts"/>
/// <reference path="stats.d.ts"/>
/// <reference path="jquery.d.ts"/>

class Entity {
    type: string;
    name: string;
    x: number;
    y: number;
    z: number;

    id: number;
}

class World {
    entities: Entity[];
}

class Viewer {
    //#region 3D

    stats: Stats;
    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;


    hightlightScene: THREE.Scene;
    hightlightMaterial: THREE.MeshPhongMaterial;

    //#endregion
    
    //#region Textures

    asteroidTexture: THREE.Texture;
    largeShipTexture: THREE.Texture;
    smallShipTexture: THREE.Texture;
    gpsTexture: THREE.Texture;

    //#endregion

    //#region Backdrop

    skyboxTexture: THREE.Texture;
    skyCamera: THREE.PerspectiveCamera;
    skyScene: THREE.Scene;

    //#endregion

    //#region Controls

    raycaster: THREE.Raycaster;
    controls: THREE.OrbitControls;
    mouse: THREE.Vector2;
    cursor: THREE.Vector2;
    realScaleCheckbox: HTMLInputElement;

    //#endregion

    world: World;
    worldObjects: { [key: number]: THREE.Object3D[] };
    gpsCoordinates: THREE.Vector3[];

    //#region 2D
    
    tooltip: HTMLDivElement;
    gpsSelector: HTMLSelectElement;

    //#endregion

    constructor() {
        //#region 3D

        if (!Detector.webgl) {
            Detector.addGetWebGLMessage();
        }

        var container = document.createElement('div');
        container.style.top = '55px';
        document.body.appendChild(container);

        this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 2, 20000000);
        this.camera.position.z = 1000;
        this.camera.scale.x = 1;
        this.camera.scale.y = 1;

        this.scene = new THREE.Scene();
        this.hightlightScene = new THREE.Scene();

        this.mouse = new THREE.Vector2();
        this.cursor = new THREE.Vector2();

        this.renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
        this.renderer.autoClear = false;
        this.renderer.autoClearColor = false;
        this.renderer.autoClearDepth = false;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement);


        this.hightlightMaterial = new THREE.MeshPhongMaterial({
            transparent: true,
            opacity: 0.2,
            emissive: new THREE.Color('yellow').getHex(),
            depthTest: false,
            depthWrite: false
        });
        this.hightlightScene.overrideMaterial = this.hightlightMaterial;

        //#endregion

        //#region Controls

        this.raycaster = new THREE.Raycaster();

        this.controls = new THREE.OrbitControls(this.camera, container);
        this.controls.damping = 0.2;
        this.controls.addEventListener('change',() => this.render());

        this.realScaleCheckbox = <HTMLInputElement>document.getElementById('realScaleCheckbox');

        //#endregion

        //#region Textures

        this.asteroidTexture = THREE.ImageUtils.loadTexture('/images/asteroid.jpg');
        this.gpsTexture = THREE.ImageUtils.loadTexture('/images/gps.png');
        this.largeShipTexture = THREE.ImageUtils.loadTexture('/images/large_ship.png');
        this.smallShipTexture = THREE.ImageUtils.loadTexture('/images/small_ship.png');
        this.skyboxTexture = THREE.ImageUtils.loadTexture('/images/skybox.png');

        //#endregion

        //#region Backgrop

        var geometry = new THREE.SphereGeometry(3000, 60, 40);
        var uniforms = {
            texture: { type: 't', value: this.skyboxTexture }
        };

        var material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: document.getElementById('sky-vertex').innerText,
            fragmentShader: document.getElementById('sky-fragment').innerText
        });

        var skyBox = new THREE.Mesh(geometry, material);
        skyBox.scale.set(-1, 1, 1);
        skyBox.eulerOrder = 'XZY';
        this.skyScene = new THREE.Scene();
        this.skyScene.add(skyBox);

        this.skyCamera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 2, 2000000);

        //#endregion

        //#region 2D

        this.tooltip = document.createElement('div');
        this.tooltip.style.position = 'absolute';
        this.tooltip.style.left = '120px';
        this.tooltip.style.top = '60px';
        this.tooltip.style.right = '0';
        this.tooltip.style.height = '48px';
        this.tooltip.style.lineHeight = '48px';
        this.tooltip.style.color = 'white';
        container.appendChild(this.tooltip);

        this.gpsSelector = <HTMLSelectElement>document.getElementById('gps_selector');
        this.gpsSelector.addEventListener('change',() => this.onGpsSelectorChange());

        //#endregion

        //#region Stats

        this.stats = new Stats();
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.top = '60px';
        container.appendChild(this.stats.domElement);

        //#endregion
        
        //#region Event handlers
        
        window.addEventListener('resize',() => this.onWindowResize(), false);
        document.addEventListener('mousemove',(e) => this.onDocumentMouseMove(e), false);
        container.addEventListener('mousedown',(e) => this.onDocumentMouseDown(e), false);

        //#endregion

        this.animate();
    }

    //#region public methods

    public loadWorld(id: string) {
        console.log('Requesting world "' + id + '"');
        $.getJSON('/api/worlds/' + id).then((world: World) => {
            this.displayWorld(world);
        });
    }

    public displayWorld(world: World) {
        console.log('Creating world geometry');
        this.world = world;
        this.clearGps();

        // Clear scene
        this.resetScene();
        
        // Create objects
        for (var i = 0; i < world.entities.length; i++) {
            var entity = world.entities[i];
            var objects = this.createObjects(entity);
            if (objects == null) {
                continue;
            }

            for (var j = 0; j < objects.length; j++) {
                var object = objects[j];
                object.userData = entity;
                this.scene.add(object);
            }

            this.worldObjects[i] = objects;
            entity.id = i;
        }

        console.log('World geometry is ready');
    }

    //#endregion

    //#region event handlers

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.skyCamera.aspect = window.innerWidth / window.innerHeight;
        this.skyCamera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onDocumentMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

        this.cursor.x = event.clientX;
        this.cursor.y = event.clientY;
    }

    onDocumentMouseDown(event) {
        if (this.activeObject) {
            this.navigateTo(new THREE.Vector3(this.activeObject.x, this.activeObject.y, this.activeObject.z));
        }
    }


    onGpsSelectorChange() {
        var index = parseInt(this.gpsSelector.value);
        this.navigateTo(this.gpsCoordinates[index]);
    } 
    
    //#endregion

    //#region private methods

    createSphereObject(entity: Entity, size: number, color: THREE.Color, texture?: THREE.Texture): THREE.Object3D {
        var geometry = new THREE.SphereGeometry(size);
        var object = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: color.getHex(), map: texture }));

        object.position.x = entity.x;
        object.position.y = entity.y;
        object.position.z = entity.z;

        return object;
    }

    createSpriteObject(entity: Entity, size: number, texture: THREE.Texture, color: THREE.Color): THREE.Object3D {
        var geometry = new THREE.Geometry();
        var vertex = new THREE.Vector3();
        vertex.x = entity.x;
        vertex.y = entity.y;
        vertex.z = entity.z;
        geometry.vertices.push(vertex);
        var material = new THREE.PointCloudMaterial({
            size: size,
            map: texture,
            blending: THREE.AdditiveBlending,
            color: color.getHex(),
            sizeAttenuation: false,
            depthTest: false,
            transparent: true
        });
        var object = new THREE.PointCloud(geometry, material);
        (<any>object).pointcloud = true;
        return object;
    }

    createObjects(entity: Entity): THREE.Object3D[] {
        switch (entity.type) {
            case 'LARGE_SHIP':
                {
                    var largeShipSprite = this.createSpriteObject(entity, 25, this.largeShipTexture, new THREE.Color('red'));
                    var largeShipDummy = this.createSphereObject(entity, 50, new THREE.Color(0.5, 0.5, 0.5));
                    largeShipDummy.visible = false;

                    return [largeShipSprite, largeShipDummy];
                }
            case 'SMALL_SHIP':
                {
                    var smallShipSprite = this.createSpriteObject(entity, 25, this.largeShipTexture, new THREE.Color('green'));
                    var smallShipDummy = this.createSphereObject(entity, 50, new THREE.Color(0.5, 0.5, 0.5));
                    smallShipDummy.visible = false;

                    return [smallShipSprite, smallShipDummy];
                }

            case 'GPS':
                {
                    var gpssprite = this.createSpriteObject(entity, 25, this.gpsTexture, new THREE.Color('skyblue'));
                    var gpsdummy = this.createSphereObject(entity, 50, new THREE.Color(0.5, 0.5, 0.5));
                    gpsdummy.visible = false;

                    this.addGps(entity.name, gpsdummy.position);

                    return [gpssprite, gpsdummy];
                }

            case 'DEBRIS':
                {
                    return null;
                }

            case 'ASTEROID':
            default:
                {
                    var asteroid = this.createSphereObject(entity, 50, new THREE.Color(0.5, 0.5, 0.5), this.asteroidTexture);
                    return [asteroid];
                }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.render();
        this.stats.update();
    }

    updateTooltip(text: string) {
        this.tooltip.innerText = text;
    }

    resetScene() {
        this.worldObjects = {};

        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }

        // Create light source
        var light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1).normalize();
        this.scene.add(light);

        var light2 = new THREE.HemisphereLight(0xffffff, 1);
        light2.position.set(1, 1, 1).normalize();
        this.scene.add(light2);
    }

    clearGps() {
        this.gpsCoordinates = [];
        this.gpsSelector.innerHTML = '';
        this.gpsSelector.innerHTML += '<option value="" selected=""selected>&lt; GPS &gt;</option>';
    }

    addGps(name: string, position: THREE.Vector3) {
        this.gpsCoordinates.push(position);
        var index = this.gpsCoordinates.length - 1;
        this.gpsSelector.innerHTML += '<option value="' + index + '">' + name + '</option>';
    }

    navigateTo(position: THREE.Vector3) {
        this.scene.position.set(-position.x, -position.y, -position.z);
        this.hightlightScene.position.set(-position.x, -position.y, -position.z);
        this.controls.update();
    }

    activeObject: Entity;

    render() {
        this.skyCamera.setRotationFromEuler(this.camera.rotation);
        this.skyCamera.updateProjectionMatrix();

        this.raycaster.setFromCamera(this.mouse, this.camera);
        var intersects = this.raycaster.intersectObjects(this.scene.children);

        this.activeObject = null;

        if (intersects.length > 0) {
            var obj = intersects[0].object;
            this.activeObject = <Entity>obj.userData;
            var position = new THREE.Vector3(this.activeObject.x, this.activeObject.y, this.activeObject.z);
            var distance = Math.round(position.sub(this.controls.target).length() / 1000);
            this.updateTooltip(this.activeObject.type + ' ' + this.activeObject.name + ' (' + distance + ' km away)');
        } else {
            if (this.activeObject) {
                this.activeObject = null;
                this.updateTooltip(null);
            }
        }

        var disableAutoScale = this.realScaleCheckbox.checked;

        for (var j = 0; j < this.scene.children.length; j++) {
            var child = this.scene.children[j];
            var distance = child.position.sub(this.controls.target).length() / 1000;

            var scale = 1;
            if (distance > 5 && disableAutoScale) {
                scale += (distance - 5) / 20;
            }

            child.scale.set(scale, scale, scale);
        }


        this.renderer.clear();
        this.renderer.render(this.skyScene, this.skyCamera);
        this.renderer.clearDepth();
        this.renderer.render(this.scene, this.camera);

        if (this.activeObject) {
            var objects = this.worldObjects[this.activeObject.id];

            for (var j = 0; j < objects.length; j++) {
                var object = <any>objects[j];
                var visible = object.visible;
                object.visible = true;
                this.scene.remove(object);
                this.hightlightScene.add(object);


                this.renderer.render(this.hightlightScene, this.camera);
                this.hightlightScene.remove(object);
                this.scene.add(object);
                object.visible = visible;

            }
        }
    }

    //#endregion
}

