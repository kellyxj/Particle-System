var partSys1 = new ParticleSystem(solverTypes.velVerlet);
var partSys2 = new ParticleSystem(solverTypes.velVerlet);
var partSys3 = new ParticleSystem(solverTypes.velVerlet);
var partSys4 = new ParticleSystem(solverTypes.velVerlet);
var partSys5 = new ParticleSystem(solverTypes.velVerlet);
var partSys6 = new ParticleSystem(solverTypes.velVerlet);
var partSys7 = new ParticleSystem(solverTypes.velVerlet);

const particleSystems = [];

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
var eyePosition = [-30, 0, 2];
var panAngle = 0;
var tiltAngle = 0;
var inverted = false;

var paused = false;

var worldBox = new VBObox();



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
  worldBox.init(gl, makeGroundGrid(), 400);
  worldBox.drawMode = gl.LINES;

    //camera controls
    document.addEventListener("keydown", (e) => {
      console.log(e.key)
        if(e.key === "w") {
        eyePosition[0] += 0.1*Math.cos(Math.PI*panAngle/180)*Math.cos(Math.PI*tiltAngle/180);
        eyePosition[1] += 0.1*Math.sin(-Math.PI*panAngle/180)*Math.cos(Math.PI*tiltAngle/180);
        eyePosition[2] += 0.1*Math.sin(Math.PI*tiltAngle/180);
    
      }
      if(e.key === "s") {
        eyePosition[0] -= 0.1*Math.cos(Math.PI*panAngle/180)*Math.cos(Math.PI*tiltAngle/180);
        eyePosition[1] -= 0.1*Math.sin(-Math.PI*panAngle/180)*Math.cos(Math.PI*tiltAngle/180);
        eyePosition[2] -= 0.1*Math.sin(Math.PI*tiltAngle/180);
    
      }
      if(e.key === "a") {
        if(!inverted) {
          eyePosition[0] += 0.1*Math.sin(Math.PI*panAngle/180)*Math.cos(Math.PI*tiltAngle/180);
          eyePosition[1] += 0.1*Math.cos(-Math.PI*panAngle/180)*Math.cos(Math.PI*tiltAngle/180);	
        }
        else {
          eyePosition[0] -= 0.1*Math.sin(Math.PI*panAngle/180)*Math.cos(Math.PI*tiltAngle/180);
          eyePosition[1] -= 0.1*Math.cos(-Math.PI*panAngle/180)*Math.cos(Math.PI*tiltAngle/180);
        }
      }
      if(e.key === "d") {
        if(!inverted) {
          eyePosition[0] -= 0.1*Math.sin(Math.PI*panAngle/180)*Math.cos(Math.PI*tiltAngle/180);
          eyePosition[1] -= 0.1*Math.cos(-Math.PI*panAngle/180)*Math.cos(Math.PI*tiltAngle/180);	
        }
        else {
          eyePosition[0] += 0.1*Math.sin(Math.PI*panAngle/180)*Math.cos(Math.PI*tiltAngle/180);
          eyePosition[1] += 0.1*Math.cos(-Math.PI*panAngle/180)*Math.cos(Math.PI*tiltAngle/180);
        }
      }
      if(e.key === "e") {
        if(!inverted) {
          eyePosition[0] -= 0.1*Math.cos(Math.PI*panAngle/180)*Math.sin(Math.PI*tiltAngle/180);
          eyePosition[1] -= 0.1*Math.sin(-Math.PI*panAngle/180)*Math.sin(Math.PI*tiltAngle/180);
          eyePosition[2] += 0.1*Math.cos(Math.PI*tiltAngle/180);
        }
        else {
          eyePosition[0] += 0.1*Math.cos(Math.PI*panAngle/180)*Math.sin(Math.PI*tiltAngle/180);
          eyePosition[1] += 0.1*Math.sin(-Math.PI*panAngle/180)*Math.sin(Math.PI*tiltAngle/180);
          eyePosition[2] -= 0.1*Math.cos(Math.PI*tiltAngle/180);
        }
      }
      if(e.key === "q") {
        if(!inverted) {
          eyePosition[0] += 0.1*Math.cos(Math.PI*panAngle/180)*Math.sin(Math.PI*tiltAngle/180);
          eyePosition[1] += 0.1*Math.sin(-Math.PI*panAngle/180)*Math.sin(Math.PI*tiltAngle/180);
          eyePosition[2] -= 0.1*Math.cos(Math.PI*tiltAngle/180);
        }
        else {
          eyePosition[0] -= 0.1*Math.cos(Math.PI*panAngle/180)*Math.sin(Math.PI*tiltAngle/180);
          eyePosition[1] -= 0.1*Math.sin(-Math.PI*panAngle/180)*Math.sin(Math.PI*tiltAngle/180);
          eyePosition[2] += 0.1*Math.cos(Math.PI*tiltAngle/180);
        }
      }
      if(e.key === "ArrowUp") {
        if(!inverted) {
          if(tiltAngle + 3 > 90) {
            panAngle = panAngle+=180;
            inverted = true;
            console.log("inverted?" + inverted)
          }
          else{
            tiltAngle += 1;
          }
        }
        if(inverted) {
          if(tiltAngle - 3 < - 90) {
            panAngle += 180;
            inverted = false;
            console.log("inverted?" + inverted)
          }
          else{
            tiltAngle -=1;
          }
        }
        console.log(tiltAngle);
    
      }
      if(e.key === "ArrowDown") {
        if(!inverted) {
          if(tiltAngle - 3 < -90) {
            panAngle += 180;
            inverted = true;
            console.log("inverted?" + inverted)
          }
          else{
            tiltAngle -= 1;
          }
        }
        if(inverted) {
          if(tiltAngle + 3 > 90) {
            panAngle+=180;
            inverted = false;
            console.log("inverted?" + inverted)
          }
          else{
            tiltAngle += 1;
          }
        }
        console.log(tiltAngle);
    
      }
      if(e.key === "ArrowLeft") {
        if(inverted) {
          panAngle+= 1;
        }
        else{
          panAngle-=1;
        }
        console.log(panAngle);
    
      }
      if(e.key === "ArrowRight") {
        if(inverted) {
          panAngle-= 1;
        }
        else{
          panAngle+=1;
        }
        console.log(panAngle);
    
      }
      if(e.key === " ") {
        paused = !paused;
      }
      if(e.key === "v") {
        changeSolver(solverTypes.velVerlet);
      }
      if(e.key === "m") {
        changeSolver(solverTypes.midpoint);
      }
      if(e.key === "i") {
        changeSolver(solverTypes.implicitMidpoint);
      }
    });

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

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
  partSys1.initPlanets(gl, 20);
  partSys2.initCloth(gl, 50);
  partSys3.initFire(gl, 1600);
  partSys4.initSpring(gl, 10);
  partSys5.initTornado(gl, 2000);
  partSys6.initRain(gl, 1500);
  partSys7.initBoids(gl, 400);
  particleSystems.push(partSys1);
  particleSystems.push(partSys2);
  particleSystems.push(partSys3);
  particleSystems.push(partSys4);
  particleSystems.push(partSys5);
  particleSystems.push(partSys6);
  particleSystems.push(partSys7);

  const gui = new dat.GUI;

  var container = document.getElementById("gui-container");
  container.appendChild(gui.domElement);

  let count = 0;
  const names = ["planets", "cloth", "fire", "spring", "tornado", "rain", "boids"];
  
  for(const partSys of particleSystems) {
    const folder = gui.addFolder(names[count]);
    count++;
    for(const force of partSys.forces) {
      switch(force.forceType) {
        case forceTypes.earthGrav:
          folder.add(force, "gravConst", -10, 10);
          break;
        case forceTypes.wind:
          folder.add(force, "windAmount", -5, 5);
          folder.add(force, "randAmount", -1, 1);
          break;
        case forceTypes.spring:
          folder.add(force, "K_spring", 0, 10);
          folder.add(force, "restLength", 0, 10);
          folder.add(force, "K_damp", 0, 1);
          break;
        case forceTypes.springSet:
          folder.add(force, "K_spring", 0, 10);
          folder.add(force, "restLength", 0, 10);
          folder.add(force, "K_damp", 0, 1);
          break;
        case forceTypes.planetGrav:
          folder.add(force, "gravConst", -100, 100);
          break;
        case forceTypes.drag:
          folder.add(force, "dragConst", -.1, 1);
          break;
        case forceTypes.turbulence:
          folder.add(force, "turbulence", 0, .01);
          break;
        case forceTypes.tornado:
          folder.add(force, "circulation", 0, 1000);
          folder.add(force, "cohesion", 0, 1000);
          folder.add(force, "updraft", 0, 100);
          break;
        case forceTypes.aligner:
          folder.add(force, "alignConst", 0, 1);
          folder.add(force, "fov", 0, 90);
      }
    }
  }

  var tick = function() {
    g_timeStep = animate();
	  drawAll(gl, g_timeStep, modelMatrix, u_ModelMatrix, mvpMatrix, u_MvpMatrix); 
	
    requestAnimationFrame(tick, canvas);   
  };
  tick();		
}

function changeSolver(solver) {
  for(const partSys of particleSystems) {
    partSys.solverType = solver;
  }
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

  worldBox.switchToMe();
  worldBox.adjust(modelMatrix, mvpMatrix);
  worldBox.draw();
  

    for(const partSys of particleSystems) {
      if(!paused) {
        partSys.applyForces(partSys.s1, partSys.forces);  // find current net force on each particle
        partSys.dotFinder(partSys.s1dot, partSys.s1); // find time-derivative s1dot from s1;
        partSys.solver(g_timeStep);         // find s2 from s1 & related states.
        partSys.doConstraints(g_timeStep);  // Apply all constraints.  s2 is ready! 
      }
      partSys.render(mvpMatrix);         // transfer current state to VBO, set uniforms, draw it!
      partSys.swap();  
    }

  
}

main();