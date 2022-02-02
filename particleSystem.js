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
    implicitMidpoint:4
}

class ParticleSystem {

    constructor() {
        this.nParticles = 0;
        this.solverType = solverTypes.midpoint;
        this.s1 = [];
        this.s2 = [];
        this.s1dot = [];
        this.forces = [];
        this.limits = [];
        this.vboBox = new VBObox();
    }

    add(stateVec1, stateVec2) {
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

    mult(stateVec, constant) {
        for(var particle of stateVec) {
            particle.xPos *= constant;
            particle.yPos *= constant;
            particle.zPos *= constant;

            particle.xVel *= constant;
            particle.yVel *= constant;
            particle.zVel *= constant;
        }
    }

    fill(stateVec, numParticles) {  //fill a stateVec with new particles that have 0 mass
        for(let i = 0; i < numParticles; i++) {
            const p = new Particle();
            p.mass = 0;
            stateVec.push(p);
        }
    }

    initBouncy(gl, numParticles) {
        this.nParticles = numParticles;
        
        for(var i = 0; i < numParticles; i++) {
            const p = new Particle();
            p.setRandomPosition(2, [0,0,2]);
            p.setRandomVelocity(1, [0,0,0]);

            this.s1.push(p);
        }
        this.fill(this.s1dot, numParticles)
        this.fill(this.s2, numParticles);
        const f = new earthGrav();
        this.forces.push(f);
        
        const volume = new Volume(-2, 2, -2, 2, 0, 4, 1);
        this.limits.push(volume);

        this.initVbos(gl);
    }

    initFire(gl, numParticles) {
        this.nParticles=numParticles;

        for(var i = 0; i < numParticles; i++) {
            const p = new Particle();
            p.setRandomPosition(2, [0,0,0]);
            if(p.zPos < 0) {
                p.zPos = 0;
            }
            p.colorR = 1;
            p.colorG = Math.random()*.8-.1*p.xPos*p.xPos-.1*p.yPos*p.yPos;
            p.colorB = 0;
            p.setRandomVelocity(1, [0,0,8]);
            p.age = Math.floor(Math.random()*400);

            this.s1.push(p);

        }
        this.fill(this.s1dot, numParticles)
        this.fill(this.s2, numParticles);

        const g = new earthGrav();
        this.forces.push(g);

        const b = new burner();
        this.forces.push(b);
        
        const volume = new Volume(-50, 50, -50, 50, 0, 100);
        this.limits.push(volume);

        const emitter = new ageConstraint();
        this.limits.push(emitter);

        this.initVbos(gl);
    }

    initSpring(gl) {
        //using 3 springs with an explicit solver accumulates error very quickly
        this.nParticles = 3;
        const p1 = new Particle();
        p1.setRandomPosition(0, [0,-1,1]);
        const p2 = new Particle();
        p2.setRandomPosition(0, [0, 1, 2]);
        const p3 = new Particle();
        p3.setRandomPosition(0, [1, 0, 3]);

        this.s1.push(p1);
        this.s1.push(p2);
        this.s1.push(p3);

        const q1 = new Particle();
        const q2 = new Particle();
        const q3 = new Particle();
        this.s1dot.push(q1);
        this.s1dot.push(q2);
        this.s1dot.push(q3);
        this.s2 = [...this.s1];

        const f1 = new spring(p1.index, p2.index);
        this.forces.push(f1);

        const f2 = new spring(p1.index, p3.index);
        this.forces.push(f2);

        const f3 = new spring(p2.index, p3.index);
        this.forces.push(f3);

        const g = new earthGrav();
        this.forces.push(g);

        const volume = new Volume(-10, 10, -10, 10, 0, 10, 1);
        this.limits.push(volume);

        const rope1 = new rope(p1.index, p2.index);
        const rope2 = new rope(p1.index, p3.index);
        const rope3 = new rope(p2.index, p3.index);
        this.limits.push(rope1);
        this.limits.push(rope2);
        this.limits.push(rope3);

        const radius1 = new radius(p1.index, p2.index);
        const radius2 = new radius(p1.index, p3.index);
        const radius3 = new radius(p2.index, p3.index);
        this.limits.push(radius1);
        this.limits.push(radius2);
        this.limits.push(radius3);

        this.initVbos(gl);
    }

    initPlanets(gl) {
        this.nParticles = 2;
        const p1 = new Particle();
        p1.setRandomPosition(0, [0, 0, 0]);
        p1.mass = 20000000000;
        p1.colorR = 0;
        const p2 = new Particle();
        p2.setRandomPosition(0, [0, 2, 0]);
        p2.mass = 1;
        p2.setRandomVelocity(0, [-1, 0, 0]);

        this.s1.push(p1);
        this.s1.push(p2);

        this.s2 = [...this.s1];

        const q1 = new Particle();
        const q2 = new Particle();
        this.s1dot.push(q1);
        this.s1dot.push(q2);

        const f = new planetGrav();
        this.forces.push(f);

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
            force.applyForce(s);
        }
    }

    dotFinder(dest, src) {
        for(let i = 0; i < src.length; i ++) {
            dest[i].xPos = src[i].xVel;
            dest[i].yPos = src[i].yVel;
            dest[i].zPos = src[i].zVel;
            const inverseMass = 1/src[i].mass;
            dest[i].xVel = src[i].xfTot * inverseMass;
            dest[i].yVel = src[i].yfTot * inverseMass;
            dest[i].zVel = src[i].zfTot * inverseMass;
        }
    }

    solver(g_timeStep) {
        if(this.solverType == solverTypes.midpoint) {
            const sM = [];
            this.fill(sM, this.nParticles);
            this.add(sM, this.s1);
            this.mult(this.s1dot, g_timeStep*0.001/2);
            this.add(sM, this.s1dot);
            const sMdot = [];
            this.fill(sMdot, this.nParticles);
            this.dotFinder(sMdot, sM);
            this.mult(sMdot, g_timeStep*0.001);
            this.add(this.s2, sMdot);
        }
        if(this.solverType == solverTypes.implicitMidpoint) {
            const sM0 = [];
            const sM0dot = [];
            const s20 = [];
            const s20dot = [];
            const sM1 = [];
            const sM1dot = [];
            this.fill(sM0, this.nParticles);
            this.fill(sM0dot, this.nParticles);
            this.fill(s20, this.nParticles);
            this.fill(s20dot, this.nParticles);
            this.fill(sM1, this.nParticles);
            this.fill(sM1dot, this.nParticles);
        }
    }

    doConstraints() {
        for(let i = 0; i < this.s2.length; i++) {
            for(const limit of this.limits) {
                const particle = this.s2[i];
                const particlePrev = this.s1[i];
                limit.applyLimit(this.s1, particlePrev, particle);
            }
        }
    }

    render(mvpMatrix) {
        const vertexArray = new Float32Array(this.nParticles*7);
        for(let i = 0; i < this.s1.length; i++) {
            vertexArray[7*i] = this.s1[i].xPos;
            vertexArray[7*i+1] = this.s1[i].yPos;
            vertexArray[7*i+2] = this.s1[i].zPos;
            vertexArray[7*i+3] = this.s1[i].wPos;
            vertexArray[7*i+4] = this.s1[i].colorR;
            vertexArray[7*i+5] = this.s1[i].colorG;
            vertexArray[7*i+6] = this.s1[i].colorB;
        }
        this.vboBox.switchToMe();
        this.vboBox.adjust(mvpMatrix);
        this.vboBox.vboContents = vertexArray;
        this.vboBox.reload();
        this.vboBox.draw();
        for(const constraint of this.limits) {
            constraint.render(mvpMatrix);
        }
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