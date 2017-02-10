var THREE, temporaryPosition, temporaryVector

module.exports = function(three, opts, game) {
  temporaryPosition = new three.Vector3
  temporaryVector = new three.Vector3
  
  return new View(three, opts, game)
}

function View(three, opts, game) {
  this.game = game
  THREE = three // three.js doesn't support multiple instances on a single page
  this.fov = opts.fov || 60
  this.width = opts.width || 512
  this.height = opts.height || 512
  this.vr_mode = opts.vr_mode
  this.aspectRatio = opts.aspectRatio || this.width/this.height
  this.nearPlane = opts.nearPlane || 1
  this.farPlane = opts.farPlane || 10000
  this.skyColor = opts.skyColor || 0xBFD1E5
  this.ortho = opts.ortho
  this.camera = this.ortho?(new THREE.OrthographicCamera(this.width/-2, this.width/2, this.height/2, this.height/-2, this.nearPlane, this.farPlane)):(new THREE.PerspectiveCamera(this.fov, this.aspectRatio, this.nearPlane, this.farPlane))
  this.camera.lookAt(new THREE.Vector3(0, 0, 0))

  this.camera_vr_left = this.ortho?(new THREE.OrthographicCamera(this.width/-2, this.width/2, this.height/2, this.height/-2, this.nearPlane, this.farPlane)):(new THREE.PerspectiveCamera(this.fov, this.aspectRatio, this.nearPlane, this.farPlane));
  this.camera_vr_left.eulerOrder = 'YXZ';
  this.camera_vr_right = this.ortho?(new THREE.OrthographicCamera(this.width/-2, this.width/2, this.height/2, this.height/-2, this.nearPlane, this.farPlane)):(new THREE.PerspectiveCamera(this.fov, this.aspectRatio, this.nearPlane, this.farPlane));
  this.camera_vr_right.eulerOrder = 'YXZ';

  this.vr_offset = opts.vr_offset;

  if (!process.browser) return

  this.createRenderer()
  this.element = this.renderer.domElement
}

View.prototype.createRenderer = function() {
  this.renderer = new THREE.WebGLRenderer({
    antialias: true
  })
  this.renderer.setSize(this.width, this.height)
  this.renderer.setClearColorHex(this.skyColor, 1.0)
  this.renderer.clear()
}

View.prototype.bindToScene = function(scene) {
  scene.add(this.camera)
}

View.prototype.getCamera = function() {
  return this.camera
}

View.prototype.cameraPosition = function() {
  temporaryPosition.multiplyScalar(0)
  temporaryPosition.applyMatrix4(this.camera.matrixWorld)
  return [temporaryPosition.x, temporaryPosition.y, temporaryPosition.z]
}

View.prototype.cameraVector = function() {
  temporaryVector.multiplyScalar(0)
  temporaryVector.z = -1
  this.camera.matrixWorld.rotateAxis(temporaryVector)
  return [temporaryVector.x, temporaryVector.y, temporaryVector.z]
}

View.prototype.resizeWindow = function(width, height) {
  if (this.element.parentElement) {
    width = width || this.element.parentElement.clientWidth
    height = height || this.element.parentElement.clientHeight
  }

  this.camera.aspect = this.aspectRatio = width/height
  this.width = width
  this.height = height

  this.camera.updateProjectionMatrix()

  this.renderer.setSize( width, height )
}

View.prototype.render = function(scene) {
  if (this.vr_mode) {
    this.renderer.enableScissorTest(true);

    var left = this.width * 0.5;
    var bottom = 0;
    var width = this.width * 0.5;
    var height = this.height;

    this.renderer.setViewport(left, bottom, width, height)
    this.renderer.setScissor(left, bottom, width, height)
    this.camera_vr_right.rotation.copy(this.camera.rotation)
    this.camera_vr_right.rotation.y = this.game.controls._yaw_target.rotation.y
    this.camera_vr_right.position.copy(this.camera.localToWorld(new THREE.Vector3(this.vr_offset, 0, 0)))
    this.camera_vr_right.aspect = width / height
    this.camera_vr_right.updateProjectionMatrix()
    this.renderer.render(scene, this.camera_vr_right)

    left = 0;
    this.renderer.setViewport(left, bottom, width, height)
    this.renderer.setScissor(left, bottom, width, height)
    this.camera_vr_left.rotation.copy(this.camera.rotation)
    this.camera_vr_left.rotation.y = this.game.controls._yaw_target.rotation.y
    this.camera_vr_left.position.copy(this.camera.localToWorld(new THREE.Vector3(- this.vr_offset, 0, 0)))
    this.camera_vr_left.aspect = width / height
    this.camera_vr_left.updateProjectionMatrix()
    this.renderer.render(scene, this.camera_vr_left)

  } else {
    this.renderer.render(scene, this.camera)
  }
}

View.prototype.appendTo = function(element) {
  if (typeof element === 'object') {
    element.appendChild(this.element)
  }
  else {
    document.querySelector(element).appendChild(this.element)
  }

  this.resizeWindow(this.width,this.height)
}
