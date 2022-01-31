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
    }

    add(stateVec1, stateVec2) {
        for(let i = 0; i < this.nParticles; i++) {
            stateVec1[i].xPos += stateVec2[i].xPos;
            stateVec1[i].yPos += stateVec2[i].yPos;
            stateVec1[i].zPos += stateVec2[i].zPos;

            stateVec1[i].xVel += stateVec2[i].xVel;
            stateVec1[i].yVel += stateVec2[i].yVel;
            stateVec1[i].zVel += stateVec2[i].zVel;
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
        const vertexArray = new Float32Array(this.nParticles * 4);
        for(var i = 0; i < numParticles; i++) {
            var p = new Particle();
            p.setRandomPosition();
            p.setRandomVelocity();
            
            vertexArray[4*i] = p.xPos;
            vertexArray[4*i+1] = p.yPos;
            vertexArray[4*i+2] = p.zPos;
            vertexArray[4*i+3] = p.wPos;
            this.s1.push(p);

            var q = new Particle();
            this.s1dot.push(q);
        }
        this.s2 = [...this.s1];
        const f = new earthGrav();
        this.forces.push(f);
        
        const box = new Box();
        this.limits.push(box);

        this.FSIZE = vertexArray.BYTES_PER_ELEMENT;
        this.vboID = gl.createBuffer();
        if (!this.vboID) {
            console.log('PartSys.init() Failed to create the VBO object in the GPU');
            return -1;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vboID);
        gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.DYNAMIC_DRAW);

        this.a_PositionID = gl.getAttribLocation(gl.program, 'a_Position');
        if(this.a_PositionID < 0) {
            console.log('PartSys.init() Failed to get the storage location of a_Position');
            return -1;
        }
        
        gl.vertexAttribPointer(this.a_PositionID, 
            4,  // # of values in this attrib (1,2,3,4) 
            gl.FLOAT, // data type (usually gl.FLOAT)
            false,    // use integer normalizing? (usually false)
            4*this.FSIZE,  // Stride: #bytes from 1st stored value to next one
            0); // Offset; #bytes from start of buffer to 
                      // 1st stored attrib value we will actually use.
    // Enable this assignment of the bound buffer to the a_Position variable:
         gl.enableVertexAttribArray(this.a_PositionID);
    }

    applyForces(s, forceList) {
        for(const particle of s) {
            particle.xfTot = 0;
            particle.yfTot = 0;
            particle.zfTot = 0;
        }
        for(const particle of s) {
            for(const force of forceList) {
                if(force.forceType == forceTypes.earthGrav) {
                    particle.xfTot += particle.mass * force.gravConst * force.down.elements[0];
                    particle.yfTot += particle.mass * force.gravConst * force.down.elements[1];
                    particle.zfTot += particle.mass * force.gravConst * force.down.elements[2];
                }
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
            p.xPos = 0;
            p.yPos = 0;
            p.zPos = 0;
            p.xVel = 0;
            p.yVel = 0;
            p.zVel = 0;
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
                if(particle.xPos < limit.xMin) {
                    particle.xPos = limit.xMin;
                    particle.xVel = this.s1[i].xVel;
                    if(particle.xVel < 0) {
                        particle.xVel = -particle.xVel * limit.Kresti;
                    }
                    else {
                        particle.xVel = particle.xVel * limit.Kresti;
                    }
                }
                if(particle.yPos < limit.yMin) {
                    particle.yPos = limit.yMin;
                    particle.yVel = this.s1[i].yVel;
                    if(particle.yVel < 0) {
                        particle.yVel = -particle.yVel  * limit.Kresti;
                    }
                    else {
                        particle.xVel = particle.yVel * limit.Kresti;
                    }
                }
                if(particle.zPos < limit.zMin) {
                    particle.zPos = limit.zMin;
                    particle.zVel = this.s1[i].zVel;
                    if(particle.zVel < 0) {
                        particle.zVel = -particle.zVel  * limit.Kresti;
                    }
                    else {
                        particle.xVel = particle.zVel * limit.Kresti;
                    }
                }
                if(particle.xPos > limit.xMax) {
                    particle.xPos = limit.xMax;
                    particle.xVel = this.s1[i].xVel;
                    if(particle.xVel > 0) {
                        particle.xVel = -particle.xVel  * limit.Kresti;
                    }
                    else {
                        particle.xVel = particle.xVel * limit.Kresti;
                    }
                }
                if(particle.yPos > limit.yMax) {
                    particle.yPos = limit.yMax;
                    particle.yVel = this.s1[i].yVel;
                    if(particle.yVel > 0) {
                        particle.yVel = -particle.yVel  * limit.Kresti;
                    }
                    else {
                        particle.xVel = particle.yVel * limit.Kresti;
                    }
                }
                if(particle.zPos > limit.zMax) {
                    particle.zPos = limit.zMax;
                    particle.zVel = this.s1[i].zVel;
                    if(particle.zVel > 0) {
                        particle.zVel = -particle.zVel  * limit.Kresti;
                    }
                    else {
                        particle.xVel = particle.zVel * limit.Kresti;
                    }
                }
            }
        }
    }

    render(gl) {
        const vertexArray = new Float32Array(this.nParticles*4);
        for(let i = 0; i < this.s1.length; i++) {
            vertexArray[4*i] = this.s1[i].xPos;
            vertexArray[4*i+1] = this.s1[i].yPos;
            vertexArray[4*i+2] = this.s1[i].zPos;
            vertexArray[4*i+3] = this.s1[i].wPos;
        }
        gl.bufferSubData( 
            gl.ARRAY_BUFFER,  // specify the 'binding target': either
                    //    gl.ARRAY_BUFFER (VBO holding sets of vertex attribs)
                    // or gl.ELEMENT_ARRAY_BUFFER (VBO holding vertex-index values)
            0,      // offset: # of bytes to skip at the start of the VBO before 
                      // we begin data replacement.
            vertexArray); // Float32Array data source.

        gl.drawArrays(gl.POINTS,          // mode: WebGL drawing primitive to use 
            0,                  // index: start at this vertex in the VBO;
            this.nParticles); 
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