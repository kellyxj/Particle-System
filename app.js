(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var glsl = require("glslify");
var VSHADER_SOURCE = glsl(["#define GLSLIFY 1\nuniform mat4 u_ModelMatrix;\nuniform mat4 u_MvpMatrix;\n  attribute vec4 a_Position;\n  varying vec4 v_Color;\n  void main() {\n    gl_Position = u_MvpMatrix * u_ModelMatrix * (a_Position);\n    gl_PointSize = 10.0;\n    v_Color = vec4(1.0, 1.0, 1.0, 1.0);\n}"]);

// Fragment shader program----------------------------------
var FSHADER_SOURCE = glsl(["//  #ifdef GL_ES\nprecision mediump float;\n#define GLSLIFY 1\n//  #endif GL_ES \n  varying vec4 v_Color;\n  void main() {\n    gl_FragColor = v_Color;\n  }"]);

var partSys = new ParticleSystem(false);

var g_last = Date.now();				//  Timestamp: set after each frame of animation,
																// used by 'animate()' function to find how much
																// time passed since we last updated our canvas.
var g_stepCount = 0;						// Advances by 1 for each timestep, modulo 1000, 
																// (0,1,2,3,...997,998,999,0,1,2,..) to identify 
																// WHEN the ball bounces.  RESET by 'r' or 'R' key.

var g_timeStep = 1000.0/60.0;			// current timestep in milliseconds (init to 1/60th sec) 
var g_timeStepMin = g_timeStep;   //holds min,max timestep values since last keypress.
var g_timeStepMax = g_timeStep;

//camera control
var eyePosition = [-5, 0, 0.5];
var panAngle = 0;
var tiltAngle = 0;
var inverted = false;

function main() {
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('main() Failed to intialize shaders.');
    return;
  }

  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  // Create a local version of our model matrix in JavaScript 
  var modelMatrix = new Matrix4();

  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  if (!u_MvpMatrix) { 
    console.log('Failed to get the storage location of u_MvpMatrix');
    return;
  }

  var mvpMatrix = new Matrix4();

  partSys.init(gl, 10);

  var tick = function() {
    g_timeStep = animate();
	  drawAll(gl, g_timeStep, modelMatrix, u_ModelMatrix, mvpMatrix, u_MvpMatrix); 
	
    requestAnimationFrame(tick, canvas);   
  };
  tick();		
}

function animate() {
  //==============================================================================  
  // Returns how much time (in milliseconds) passed since the last call to this fcn.
    var now = Date.now();	        
    var elapsed = now - g_last;	// amount of time passed, in integer milliseconds
    g_last = now;               // re-set our stopwatch/timer.
  
    return elapsed;
  }

function drawAll(gl, g_timeStep, modelMatrix, u_ModelMatrix, mvpMatrix, u_MvpMatrix) {
  gl.clear(gl.COLOR_BUFFER_BIT);
  mvpMatrix.setPerspective(30, 1, 1, 100);
  mvpMatrix.lookAt(eyePosition[0], eyePosition[1], eyePosition[2], //eye position
    eyePosition[0]+Math.cos(Math.PI*panAngle/180)*Math.cos(Math.PI*tiltAngle/180),  //x value of look at point
    eyePosition[1]+Math.sin(-Math.PI*panAngle/180)*Math.cos(Math.PI*tiltAngle/180), //y value of look at point
    eyePosition[2]+Math.sin(Math.PI*tiltAngle/180), //z value look at point
    0, 0, inverted? -1: 1); //up vector
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  partSys.print();

  partSys.applyForces(partSys.s1, partSys.forces);  // find current net force on each particle
  partSys.dotFinder(partSys.s1dot, partSys.s1); // find time-derivative s1dot from s1;
  partSys.solver(g_timeStep);         // find s2 from s1 & related states.
  partSys.doConstraints();  // Apply all constraints.  s2 is ready!
  partSys.render(gl);         // transfer current state to VBO, set uniforms, draw it!
  partSys.swap();  
  
}

main();
},{"glslify":2}],2:[function(require,module,exports){
module.exports = function(strings) {
  if (typeof strings === 'string') strings = [strings]
  var exprs = [].slice.call(arguments,1)
  var parts = []
  for (var i = 0; i < strings.length-1; i++) {
    parts.push(strings[i], exprs[i] || '')
  }
  parts.push(strings[i])
  return parts.join('')
}

},{}]},{},[1]);