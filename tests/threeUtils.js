import { THREE, OrbitControls, Stats } from '../vendor/three.esm.js'
import util from '../src/util.js'

let stats

// greggman's defaults
export function setDefaultStyle(id = 'canvas') {
    const style = document.createElement('style')
    style.innerHTML = `
      html, body { margin: 0; padding: 0; height: 100%; }
      #${id} { width: 100%; height: 100%; display: block; }
  `
    document.head.append(style)

    const meta = document.createElement('meta')
    meta.setAttribute('name', 'viewport')
    meta.content = 'width=device-width, initial-scale=1'

    document.head.append(meta)
}

export function modelCamera(renderer, model) {
    const canvas = renderer.domElement
    const camera = new THREE.PerspectiveCamera(
        45, // fov
        canvas.clientWidth / canvas.clientHeight, // aspect
        1, // near
        10000 //far
    )

    const width = model.world.width
    // perspectiveCam.position.set(width + centerX, -width - centerY, width)
    camera.position.set(width, width, width)
    // perspectiveCam.lookAt(new THREE.Vector3(centerX, centerY, 0))
    camera.up.set(0, 0, 1)

    checkResize(renderer, camera)

    return camera
}
export function addModelHelpers(renderer, scene, camera, model) {
    const width = model.world.width

    const axes = new THREE.AxesHelper((1.5 * width) / 2)
    const grid = new THREE.GridHelper(1.25 * width, 10)
    grid.rotation.x = THREE.Math.degToRad(90)

    const orbitControl = new OrbitControls(camera, renderer.domElement)

    stats = new Stats()
    document.body.appendChild(stats.dom)

    scene.add(axes)
    scene.add(grid)
}

// https://threejsfundamentals.org/threejs/lessons/threejs-responsive.html
export function checkResize(renderer, camera) {
    const canvas = renderer.domElement
    const pixelRatio = window.devicePixelRatio

    const width = (canvas.clientWidth * pixelRatio) | 0 // | round down
    const height = (canvas.clientHeight * pixelRatio) | 0
    const needResize = canvas.width !== width || canvas.height !== height

    if (needResize) {
        renderer.setSize(width, height, false)
        camera.aspect = canvas.clientWidth / canvas.clientHeight
        camera.updateProjectionMatrix()
    }
    return needResize
}

export function renderOnce(renderer, scene, camera, fcn) {
    checkResize(renderer, camera)
    fcn()
    renderer.render(scene, camera)
}
export function animate(renderer, scene, camera, fcn) {
    function render(time) {
        if (!stats) {
            stats = new Stats()
            document.body.appendChild(stats.dom)
        }
        // stats.begin()

        checkResize(renderer, camera)
        fcn(time)
        renderer.render(scene, camera)
        requestAnimationFrame(render)

        // stats.end()
        stats.update()
    }
    requestAnimationFrame(render)
}

export function directionalLight(
    scene,
    position,
    color = 0xffffff,
    intensity = 1
) {
    const light = new THREE.DirectionalLight(color, intensity)
    light.position.set(...position)
    scene.add(light)
}

export function modelLight(scene, model, intensity = 1, color = 0xffffff) {
    const width = model.world.width

    const light = new THREE.DirectionalLight(color, intensity)
    light.position.set(width, width, width)
    scene.add(light)

    const light1 = new THREE.DirectionalLight(color, intensity)
    light1.position.set(width, width, -width)
    scene.add(light1)
}

const primitiveNames = [
    'Box',
    'Circle',
    'Cone',
    'Cylinder',
    'Dodecahedron',
    // 'Extrude',
    'Icosahedron',
    // 'Lathe',
    'Octahedron',
    // 'Parametric',
    'Plane',
    // 'Polyhedron',
    'Ring',
    // 'Shape',
    'Sphere',
    'Tetrahedron',
    // 'Text',
    'Torus',
    // 'TorusKnot',
    // 'Tube',
]
export function primitiveGeometry(name, params = []) {
    if (!name) name = util.oneOf(primitiveNames)
    name = name[0].toUpperCase() + name.slice(1)
    const geometryName = name + 'BufferGeometry'
    return new THREE[geometryName](...params)
}

export function turtleGeometry() {
    const ax = 0.5
    const bx = -0.5
    const by = -0.5
    const cx = -0.3
    const top = 0.35
    const bot = 0

    const geometry = new THREE.Geometry()
    geometry.vertices.push(
        new THREE.Vector3(ax, 0, bot), //   A 0
        new THREE.Vector3(bx, by, bot), //  B 1
        new THREE.Vector3(cx, 0, top), //   C 2
        new THREE.Vector3(bx, -by, bot), // D 3
        new THREE.Vector3(cx, 0, bot) //    E 4
    )

    const [A, B, C, D, E] = [0, 1, 2, 3, 4]
    geometry.faces.push(
        new THREE.Face3(A, D, C),
        new THREE.Face3(A, C, B),
        new THREE.Face3(A, B, E),
        new THREE.Face3(A, E, D),
        new THREE.Face3(C, D, E),
        new THREE.Face3(C, E, B)
    )

    geometry.computeFaceNormals()
    return geometry
}

export function disposeMesh(mesh, scene) {
    mesh.geometry.dispose()
    mesh.material.dispose()
    // mesh.material = mesh.geometry = null
    scene.remove(mesh)
}

export function matrixToString(matrix) {
    const mat = matrix.map(num => Math.round(num * 100) / 100)
    const r0 = mat.slice(0, 4).toString()
    const r1 = mat.slice(4, 8).toString()
    const r2 = mat.slice(8, 12).toString()
    const r3 = mat.slice(12, 16).toString()
    return `${r0}
${r1}
${r2}
${r3}`.replace(/,/g, ', ')
}
