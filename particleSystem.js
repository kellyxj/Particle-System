class Particle {
   static numParticles = 0;

    constructor() {
        this.index = Particle.numParticles;
        Particle.numParticles++;
        this.xPos = 0;
        this.yPos = 0;
        this.zPos = 0;
        this.wPos = 1;
        this.xVel = 0;
        this.yVel = 0;
        this.zVel = 0;
        this.xfTot = 0;
        this.yfTot = 0;
        this.zfTot = 0;
        this.colorR = 1;
        this.colorG = 1;
        this.colorB = 1;
        this.age = 0;
        this.mass = 1;
        this.diameter = 10;
    }

    setRandomPosition(radius, center) {
        const theta = 2*Math.PI*Math.random();
        const phi = 2*Math.PI*Math.random();
        this.xPos = center[0]+radius * Math.random() * Math.sin(theta) * Math.cos(phi);
        this.yPos = center[1]+radius * Math.random() * Math.sin(theta) * Math.sin(phi);
        this.zPos = center[2]+radius * Math.random() * Math.cos(theta);
        this.wPos = 1;
    }

    setRandomVelocity(randAmount, initVel) {
        this.xVel = initVel[0]+randAmount*(2*Math.random()-1);
        this.yVel = initVel[1]+randAmount*(2*Math.random()-1);
        this.zVel = initVel[2]+randAmount*(2*Math.random()-1);
    }
}

function distance(p1, p2) {
    const distance = Math.sqrt(Math.max((p1.xPos-p2.xPos) * (p1.xPos-p2.xPos) + //taking this max doesn't look necessary,
                                (p1.yPos-p2.yPos) * (p2.xPos-p2.yPos) +         //but sometimes this is negative because of floating point error
                                (p1.zPos-p2.zPos) * (p1.zPos-p2.zPos), 0));
    return distance;
}

const solverTypes = {
    euler:1,
    implicitEuler:2,
    midpoint:3,
    implicitMidpoint:4,
    velVerlet:5
}

class ParticleSystem {

    constructor(solver) {
        this.nParticles = 0;
        this.modelMatrix = new Matrix4();
        this.solverType = solver;
        this.s1 = [];
        this.s2 = [];
        this.s1dot = [];
        this.forces = [];
        this.limits = [];
        this.vboBox = new VBObox();
    }

    add(stateVec1, stateVec2) {     //stateVec1 += stateVec2
        for(let i = 0; i < this.nParticles; i++) {
            stateVec1[i].xPos += stateVec2[i].xPos;
            stateVec1[i].yPos += stateVec2[i].yPos;
            stateVec1[i].zPos += stateVec2[i].zPos;

            stateVec1[i].xVel += stateVec2[i].xVel;
            stateVec1[i].yVel += stateVec2[i].yVel;
            stateVec1[i].zVel += stateVec2[i].zVel;

            stateVec1[i].xfTot += stateVec2[i].xfTot;
            stateVec1[i].yfTot += stateVec2[i].yfTot;
            stateVec1[i].zfTot += stateVec2[i].zfTot;

            stateVec1[i].mass += stateVec2[i].mass;
        }
    }

    mult(stateVec, constant) {      //stateVec *= constant
        for(var particle of stateVec) {
            particle.xPos *= constant;
            particle.yPos *= constant;
            particle.zPos *= constant;

            particle.xVel *= constant;
            particle.yVel *= constant;
            particle.zVel *= constant;

            particle.mass *= constant;
        }
    }

    makeParticles(stateVec, numParticles, mass) {  //fill a stateVec with new particles
        for(let i = 0; i < numParticles; i++) {
            const p = new Particle();
            p.mass = mass;
            stateVec.push(p);
        }
    }

    initTornado(gl, numParticles) {
        this.nParticles = numParticles;
        
        for(var i = 0; i < numParticles; i++) {
            const p = new Particle();
            p.setRandomPosition(50, [0,0,0]);
            p.zPos = 0;
            const randomVar = Math.random();
            p.colorR = .3+randomVar*.2;
            p.colorG = .3+randomVar*.2;
            p.colorB = .3+randomVar*.2;
            p.setRandomVelocity(3, [0,0,0]);
            p.age = Math.floor(Math.random() * 1500);

            this.s1.push(p);
        }
   
        this.makeParticles(this.s1dot, this.nParticles, 0);
        this.makeParticles(this.s2, this.nParticles, 1);


        const f = new earthGrav();
        this.forces.push(f);

        const t = new Tornado();
        this.forces.push(t);
        
        const d = new Drag(.15);
        this.forces.push(d);

        const d2 = new Turbulence(.01, 35);
        this.forces.push(d2);

        const a = new Ager();
        this.forces.push(a);

        const emitter = new TornadoConstraint(1500);
        emitter.setInitPos(50, [0,0,0]);
        emitter.setInitVel(3,[0,0,0]);
        this.limits.push(emitter);
        
        const volume = new CylinderVol(100, [0, 0, 0], 200, 1);
        this.limits.push(volume);

        this.modelMatrix.setTranslate(0, -5, 0);
        this.modelMatrix.scale(.01 ,.01 ,.01);

        this.initVbos(gl);
    }

    initFire(gl, numParticles) {
        this.nParticles=numParticles;

        for(var i = 0; i < numParticles; i++) {
            const p = new Particle();
            p.setRandomPosition(1, [0,0,0]);
            p.zPos = 0;
            p.colorR = 1;
            p.colorG = Math.random()*.7-.5*p.xPos*p.xPos-.5*p.yPos*p.yPos;
            p.colorB = 0;
            p.setRandomVelocity(5, [0,0,20]);
            p.age = Math.floor(Math.random()*200);

            this.s1.push(p);
        }
        this.makeParticles(this.s1dot, this.nParticles, this.nParticles);
        this.s2 = [...this.s1];

        const g = new earthGrav();
        this.forces.push(g);

        const b = new Burner();
        this.forces.push(b);

        const d = new Drag(.1);
        this.forces.push(d);

        const t = new Turbulence(.01, 20);
        this.forces.push(t);

        const w = new Wind(.5, .1);
        w.windDirection = new Vector4([0, -.5, .866, 0]);
        this.forces.push(w);       
        
        const volume = new Volume(-10, 10, -10, 10, 0, 20, 0);
        this.limits.push(volume);

        const emitter = new FireConstraint(100);
        emitter.setInitPos(1, [0,0,0]);
        emitter.setInitVel(5,[0,0,20]);
        this.limits.push(emitter);

        this.modelMatrix.setTranslate(0, 5, 0);
        this.modelMatrix.scale(.2, .2, .2);

        this.initVbos(gl);
    }

    initSpring(gl, numParticles) {
        //If using more than 20 springs, make sure to disable rendering them
        this.nParticles = numParticles;
        const s = new SpringSet(3, 5, .4);
        for(let i = 0; i < this.nParticles; i++) {
            const p = new Particle();
            p.setRandomPosition(10, [0, 0, 10]);
            p.setRandomVelocity(1, [0,0,0]);
            this.s1.push(p);
            if(i != 0) {
                s.makeSpring(this.s1[i].index, this.s1[i-1].index);
                const r = new Rope(this.s1[i].index, this.s1[i-1].index, 10);
                this.limits.push(r);
            }
            if(i > 1) {
                s.makeSpring(this.s1[i].index, this.s1[i-2].index);
                const r = new Rope(this.s1[i].index, this.s1[i-2].index, 10);
                this.limits.push(r);
            }
        }
        this.forces.push(s);

        this.makeParticles(this.s1dot, this.nParticles);
        this.s2 = [...this.s1];

        const g = new earthGrav();
        this.forces.push(g);

        const d = new Drag(.1);
        this.forces.push(d);

        const t = new Turbulence(.01, 25);
        this.forces.push(t);

        /*const radius1 = new Radius(p1.index, p2.index);
        const radius2 = new Radius(p1.index, p3.index);
        const radius3 = new Radius(p2.index, p3.index);
        this.limits.push(radius1);
        this.limits.push(radius2);
        this.limits.push(radius3);*/

        const volume = new SphereVol(10, [0, 0, 10], 1);
        this.limits.push(volume);
        
        this.modelMatrix.setTranslate(0, 0, 0);
        this.modelMatrix.scale(.1, .1, .1);

        this.initVbos(gl);
    }

    initPlanets(gl, numParticles) {
        this.nParticles = numParticles;

        for(let i = 0; i < this.nParticles; i++) {
            const p = new Particle;
            p.colorR = .3+Math.random()/2;
            p.colorG = .3+Math.random()/2;
            p.colorB = .3+Math.random()/2;
            p.setRandomPosition(100, [0, 0, 100]);
            p.setRandomVelocity(20, [0,0,0]);
            this.s1.push(p);
        }

        this.makeParticles(this.s1dot, this.nParticles);

        this.s2 = [...this.s1];

        this.makeParticles(this.s1dot, this.nParticles);

        const f = new planetGrav(20, Infinity);
        this.forces.push(f);

        const volume = new SphereVol(100, [0, 0, 100], 1);
        this.limits.push(volume);

        const c = new Cylinder(50, [0, 0, 10], 180, 1);
        this.limits.push(c);

        this.modelMatrix.setTranslate(0, 15, 0);
        this.modelMatrix.scale(.02, .02, .02);

        this.initVbos(gl);
    }

    initCloth(gl, numParticles) {
        this.nParticles = numParticles;
        const s = new SpringSet(.1, 1, .99);
        for(let i = 0; i < this.nParticles; i++) {
            const p = new Particle();
            p.zPos = i+this.nParticles;
            this.s1.push(p);
            if(i != 0) {
                s.makeSpring(this.s1[i].index, this.s1[i-1].index);
                const r = new Rope(this.s1[i].index, this.s1[i-1].index, 1.1);
                this.limits.push(r);
            }
        }
        s.renderOn = false;     //disable rendering springs for performance
        this.forces.push(s);
        this.s2 = [...this.s1];
        const anchor = new Volume(0, 0, 0, 0, 2*this.nParticles-1, 2*this.nParticles-1, 0);
        anchor.targetList.push(this.s1[this.nParticles-1].index);
        this.limits.push(anchor);

        const v = new Volume(-50, 50, -50, 50, 0, 2*this.nParticles, 1);
        this.limits.push(v);

        const w = new Wind(.05, .01);
        this.forces.push(w);

        const g = new earthGrav();
        this.forces.push(g);

        const d = new Drag(.5);
        this.forces.push(d);

        const t = new Turbulence(.01, 25);
        this.forces.push(t);

        this.makeParticles(this.s1dot, this.nParticles);

        this.modelMatrix.setTranslate(0, 10, 0);
        this.modelMatrix.scale(.02, .02, .02);

        this.initVbos(gl);
    }

    initRain(gl, numParticles) {
        this.nParticles = numParticles;
        for(let i = 0; i < this.nParticles; i++) {
            const p = new Particle();
            p.setRandomPosition(10, [0, 0, 10]);
            p.xPos = 0;
            p.yPos = 0;
            p.setRandomVelocity(1, [0,0,0]);
            p.zVel = 0;
            p.colorR = .1;
            p.colorG = .1;
            p.colorB = .6 + .4 * Math.random();
            this.s1.push(p);
        }
        this.makeParticles(this.s1dot, this.nParticles);
        this.s2 = [...this.s1];

        const b = new Brownian(1, 5);
        this.forces.push(b);

        const g = new earthGrav();
        this.forces.push(g);

        const d = new Drag(.5);
        this.forces.push(d);

        const d2 = new Turbulence(.01, 35);
        this.forces.push(d2);

        const v = new Volume(-10, 10, -10, 10, 0, 20, 0);
        this.limits.push(v);

        const ball = new Ball(3, [0, 0, 10], 0);
        this.limits.push(ball);

        const a = new Portal(-10, 10, -10, 10, 0, 0, [0, 0, 0]);
        a.setInitPos(0, [0, 0, 19.9]);
        this.limits.push(a);

        this.modelMatrix.setTranslate(0, -10, 0);
        this.modelMatrix.scale(.2, .2, .2);

        this.initVbos(gl);
    }

    initBoids(gl, numParticles) {
        this.nParticles = numParticles;
        for(let i = 0; i < this.nParticles; i++) {
            const p = new Particle();
            p.setRandomPosition(100, [0, 0, 100]);
            p.setRandomVelocity(5, [0,0,0]);
            const randAmount = Math.random() * .1;
            p.colorR = 0.8 + randAmount;
            p.colorG = 0.8 + randAmount;
            p.colorB = 0.8 + randAmount;
            this.s1.push(p);
        }
        this.makeParticles(this.s1dot,this.nParticles);
        this.s2 = [...this.s1];

        const g = new planetGrav(15, 100);
        this.forces.push(g);

        const r = new planetGrav(-50, 5);
        this.forces.push(r);

        const a = new Aligner(1, 15, 60);
        this.forces.push(a);

        const d = new Drag(.1);
        this.forces.push(d);

        const d2 = new Turbulence(.01, 35);
        this.forces.push(d2);
        
        const p1 = new Portal(-100, 100, -100, 100, 0, 1, [0,0,198]);
        this.limits.push(p1);

        const p2 = new Portal(-100, 100, -100, 100, 199, 200, [0,0,-198]);
        this.limits.push(p2);

        const p3 = new Portal(-100, -99, -100, 100, 0, 200, [198,0,0]);
        this.limits.push(p3);

        const p4 = new Portal(99, 100, -100, 100, 0, 200, [-198,0,0]);
        this.limits.push(p4);

        const p5 = new Portal(-100, 100, -100, -99, 0, 200, [0,198,0]);
        this.limits.push(p5);

        const p6 = new Portal(-100, 100, 99, 100, 0, 200, [0,-198,-0]);
        this.limits.push(p6);
        
        const min = new MinVel(2);
        this.limits.push(min);

        const max = new MaxVel(20);
        this.limits.push(max)   

        const v = new Volume(-100, 100, -100, 100, 0, 200, 1);
        this.limits.push(v);

        this.modelMatrix.setTranslate(0, -15, 0);
        this.modelMatrix.scale(.01, .01, .01);

        this.initVbos(gl);
    }

    //initialize the VBO for the particle system and all VBOs for constraint objects
    initVbos(gl) {
        const vertexArray = new Float32Array(this.nParticles * 7);
        for(let i = 0; i < this.nParticles; i++) {
            const p = this.s1[i];
            vertexArray[7*i] = p.xPos;
            vertexArray[7*i+1] = p.yPos;
            vertexArray[7*i+2] = p.zPos;
            vertexArray[7*i+3] = p.wPos;
            vertexArray[7*i+4] = p.colorR;
            vertexArray[7*i+5] = p.colorG;
            vertexArray[7*i+6] = p.colorB;
        }
        this.vboBox.init(gl, vertexArray, this.nParticles);
        this.vboBox.drawMode = gl.POINTS;

        for(const force of this.forces) {
            force.initVbo(gl);
        }

        for(const constraint of this.limits) {
            constraint.initVbo(gl);
        }
    }

    applyForces(s, forceList) {
        for(const particle of s) {
            particle.xfTot = 0;
            particle.yfTot = 0;
            particle.zfTot = 0;
        }
        for(const force of forceList) {
            force.calcForce(s);
        }
    }

    dotFinder(dest, src) {
        for(let i = 0; i < src.length; i ++) {
            dest[i].xPos = src[i].xVel;
            dest[i].yPos = src[i].yVel;
            dest[i].zPos = src[i].zVel;
            const inverseMass = 1.0/(src[i].mass+0.0001);
            dest[i].xVel = src[i].xfTot * inverseMass;
            dest[i].yVel = src[i].yfTot * inverseMass;
            dest[i].zVel = src[i].zfTot * inverseMass;
            dest[i].mass = 0;
        }
    }

    solver(g_timeStep) {
        if(this.solverType == solverTypes.midpoint) {
            const sM = [];
            this.makeParticles(sM, this.nParticles,0);
            this.add(sM, this.s1);
            this.mult(this.s1dot, g_timeStep*0.001/2);
            this.add(sM, this.s1dot);
            const sMdot = [];
            this.makeParticles(sMdot, this.nParticles,0);
            this.dotFinder(sMdot, sM);
            this.mult(sMdot, g_timeStep*0.001);
            this.s2 = [...this.s1];
            this.add(this.s2, sMdot);
        }
        if(this.solverType == solverTypes.implicitMidpoint) {
            let sM0 = [];
            const sM0dot = [];
            let s20 = [];
            const s20dot = [];
            const sM1 = [];
            const sM1dot = [];
            const s31 = [];
            const sErr = [];

            this.makeParticles(sM0, this.nParticles, 0);
            this.makeParticles(sM0dot, this.nParticles, 0);
            this.makeParticles(s20, this.nParticles, 0);
            this.makeParticles(s20dot, this.nParticles, 0);
            this.makeParticles(sM1, this.nParticles, 0);
            this.makeParticles(sM1dot, this.nParticles, 0);
            this.makeParticles(s31, this.nParticles, 0);
            this.makeParticles(sErr, this.nParticles, 0);

            this.add(sM0, this.s1);
            this.mult(this.s1dot, g_timeStep*0.001/2);
            this.add(sM0, this.s1dot);
            this.dotFinder(sM0dot, sM0);

            this.add(s20, this.s1);
            this.mult(sM0dot, g_timeStep*0.001);
            this.add(s20, sM0dot);
            this.dotFinder(s20dot, s20);

            this.add(sM1, s20);
            this.mult(s20dot, -g_timeStep*0.001/2);
            this.add(sM1, s20dot);
            this.dotFinder(sM1dot, sM1);

            this.add(s31, s20);
            this.mult(sM1dot, -g_timeStep*0.001);
            this.add(s31, sM1dot);

            this.add(sErr, this.s1);
            this.mult(sErr, -1);
            this.add(sErr, s31);

            this.s2 = [];
            this.makeParticles(this.s2, this.nParticles, 0);
            for(let i = 0; i < this.s2.length; i++) {
                this.s2[i].index = this.s1[i].index;
                this.s2[i].age = this.s1[i].age;
                this.s2[i].colorR = this.s1[i].colorR;
                this.s2[i].colorG = this.s1[i].colorG;
                this.s2[i].colorB = this.s1[i].colorB;
            }
            this.add(this.s2, s20);
            this.mult(sErr, -.5);
            this.add(this.s2, sErr);

        }
        if(this.solverType == solverTypes.velVerlet) {
            for(let i = 0; i < this.nParticles; i++) {
                this.s2[i].xPos = this.s1[i].xPos + this.s1[i].xVel * g_timeStep*.001 + this.s1[i].xfTot/(this.s1[i].mass+.0001) * g_timeStep*.001*g_timeStep*.001/2;
                this.s2[i].yPos = this.s1[i].yPos + this.s1[i].yVel * g_timeStep*.001 + this.s1[i].yfTot/(this.s1[i].mass+.0001) * g_timeStep*.001*g_timeStep*.001/2;
                this.s2[i].zPos = this.s1[i].zPos + this.s1[i].zVel * g_timeStep*.001 + this.s1[i].zfTot/(this.s1[i].mass+.0001) * g_timeStep*.001*g_timeStep*.001/2;
            }
            this.applyForces(this.s2, this.forces);
            for(let i =0; i < this.nParticles; i++) {
                this.s2[i].xVel = this.s1[i].xVel + (this.s2[i].xfTot/(this.s2[i].mass + .0001) + this.s1[i].xfTot/(this.s1[i].mass+.0001)) * g_timeStep*.001/2;
                this.s2[i].yVel = this.s1[i].yVel + (this.s2[i].yfTot/(this.s2[i].mass + .0001) + this.s1[i].yfTot/(this.s1[i].mass+.0001)) * g_timeStep*.001/2;
                this.s2[i].zVel = this.s1[i].zVel + (this.s2[i].zfTot/(this.s2[i].mass + .0001) + this.s1[i].zfTot/(this.s1[i].mass+.0001)) * g_timeStep*.001/2;
                this.s2[i].age = this.s1[i].age;
                this.s2[i].colorR = this.s1[i].colorR;
                this.s2[i].colorG = this.s1[i].colorG;
                this.s2[i].colorB = this.s1[i].colorB;
            }
        }
    }

    doConstraints() {
        for(let i = 0; i < this.s2.length; i++) {
            for(const limit of this.limits) {
                const particle = this.s2[i];
                const particlePrev = this.s1[i];
                limit.doLimit(this.s1, particlePrev, particle);
            }
        }
    }

    render(mvpMatrix) {
        const vertexArray = new Float32Array(this.nParticles*7);
        for(let i = 0; i < this.s2.length; i++) {
            vertexArray[7*i] = this.s2[i].xPos;
            vertexArray[7*i+1] = this.s2[i].yPos;
            vertexArray[7*i+2] = this.s2[i].zPos;
            vertexArray[7*i+3] = this.s2[i].wPos;
            vertexArray[7*i+4] = this.s2[i].colorR;
            vertexArray[7*i+5] = this.s2[i].colorG;
            vertexArray[7*i+6] = this.s2[i].colorB;
        }
        for(const force of this.forces) {
            force.checkRender(this.modelMatrix,mvpMatrix);
        }
        for(const constraint of this.limits) {
            constraint.checkRender(this.modelMatrix, mvpMatrix);
        }
        this.vboBox.switchToMe();
        this.vboBox.adjust(this.modelMatrix, mvpMatrix);
        this.vboBox.vboContents = vertexArray;
        this.vboBox.reload();
        this.vboBox.draw();
        
    }

    print() {
        console.log("s1");
        console.log(this.s1);
        console.log("s2");
        console.log(this.s2);
        console.log("s1dot");
        console.log( this.s1dot);
    }

    swap() {
        this.s1 = [...this.s2];
    }
}