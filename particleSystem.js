class Particle {

    constructor() {
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
        this.lifetime = 1;
        this.mass = 1;
        this.diameter = 10;
    }

    setRandomPosition() {
        const radius = 1;
        const theta = 2*Math.PI*Math.random();
        const phi = 2*Math.PI*Math.random();
        this.xPos = radius * Math.sin(theta) * Math.cos(phi);
        this.yPos = radius * Math.sin(theta) * Math.sin(phi);
        this.zPos = radius * Math.cos(theta);
        this.wPos = 1;
    }

    setRandomVelocity() {
        this.xVel = Math.random();
        this.yVel = Math.random();
        this.zVel = Math.random();
    }

}

class ParticleSystem {

    constructor(isFountain) {
        this.ageConstraint = isFountain;
        this.nParticles = 0;
        this.s1 = [];
        this.s2 = [];
        this.s1dot = [];
        this.forces = [];
        this.limits = [];
        this.FSIZE;
        this.vboID;
        this.a_PositionID;
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

    init(gl, numParticles) {
        this.nParticles = numParticles;
        const vertexArray = new Float32Array(this.nParticles * 7);
        for(var i = 0; i < numParticles; i++) {
            var p = new Particle();
            p.setRandomPosition();
            p.setRandomVelocity();
            
            vertexArray[7*i] = p.xPos;
            vertexArray[7*i+1] = p.yPos;
            vertexArray[7*i+2] = p.zPos;
            vertexArray[7*i+3] = p.wPos;
            vertexArray[7*i+4] = p.colorR;
            vertexArray[7*i+5] = p.colorG;
            vertexArray[7*i+6] = p.colorB;

            this.s1.push(p);

            var q = new Particle();
            this.s1dot.push(q);
        }
        this.s2 = [...this.s1];
        const f = new earthGrav();
        this.forces.push(f);
        
        const box = new Box();
        this.limits.push(box);

        this.vboBox.init(gl, vertexArray, this.nParticles);
    }

    applyForces(s, forceList) {
        for(const particle of s) {
            particle.xfTot = 0;
            particle.yfTot = 0;
            particle.zfTot = 0;
        }
        for(const particle of s) {
            for(const force of forceList) {
                force.applyForce(particle);
            }
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
        const sM = [];
        for(let i = 0; i < this.nParticles; i++) {
            const p = new Particle();
            sM.push(p);
        }
        this.add(sM, this.s1);
        this.mult(this.s1dot, g_timeStep*0.001/2);
        this.add(sM, this.s1dot);
        const sMdot = [...this.s1dot];
        this.dotFinder(sMdot, sM);
        this.mult(sMdot, g_timeStep*0.001);
        this.add(this.s2, sMdot);
    }

    doConstraints() {
        for(let i = 0; i < this.s2.length; i++) {
            for(const limit of this.limits) {
                const particle = this.s2[i];
                const particlePrev = this.s1[i];
                limit.applyLimit(particlePrev, particle);
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