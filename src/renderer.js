import { AmbientLight, Box3, DirectionalLight, HemisphereLight, Mesh, MeshStandardMaterial, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from '../node_modules/three/build/three.module.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js'
import { STLLoader } from '../node_modules/three/examples/jsm/loaders/STLLoader.js'

import * as BufferGeometryUtils from '../node_modules/three/examples/jsm/utils/BufferGeometryUtils.js'

let camera, controls, material, mesh, renderer, scene, stlLoader;

window.ipcRender.messageFromMain((event, message) => {
    init(message[1]);
})

//  For testing
//  init('./sample.stl');

function init(path) {

    stlLoader = new STLLoader();

    stlLoader.load(
        path,
        function (geometry) {
            geometry.deleteAttribute('normal');
            geometry = BufferGeometryUtils.mergeVertices(geometry);
            geometry.computeVertexNormals();

            scene = new Scene();

            scene.add(new AmbientLight(0x7c7c7c, 3.0));

            const dirLight = new DirectionalLight(0xFFFFFF, 3.0)
            dirLight.position.set(0.32, 0.39, 0.7);
            scene.add(dirLight);

            scene.add(new HemisphereLight(0xFFFFFF, 1));

            camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
            camera.position.z = 1000;

            renderer = new WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);

            controls = new OrbitControls(camera, renderer.domElement);

            camera.position.set(0, -1, 1);

            controls.update();

            document.body.appendChild(renderer.domElement);

            material = new MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.2, metalness: 0.4 })

            mesh = new Mesh(geometry, material);

            scene.add(mesh);

            fitCameraToSelection(mesh)

            animate();
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
        },
        (error) => {
            console.log(error)
        }
    );

    //

    window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function animate() {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function fitCameraToSelection(selection, fitOffset = 1.2) {
    const box = new Box3();

    box.expandByObject(selection);

    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());

    const maxSize = Math.max(size.x, size.y, size.z);
    const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360));
    const fitWidthDistance = fitHeightDistance / camera.aspect;
    const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);

    const direction = controls.target
        .clone()
        .sub(camera.position)
        .normalize()
        .multiplyScalar(distance);

    controls.maxDistance = distance * 10;
    controls.target.copy(center);

    camera.near = distance / 100;
    camera.far = distance * 100;
    camera.updateProjectionMatrix();

    camera.position.copy(controls.target).sub(direction);

    controls.update();
}