const limitTypes = {
    none: 0,
    volume: 1,
    box: 2,
    ageConstraint: 3,
    rope: 4,
    radius:5
}

class CLimit {
    limitType = limitTypes.none;
    targFirst = 0;
    targLast = -1;
    vboBox = new VBObox();
    applyLimit(s1, particlePrev, particle) {

    }
    initVbo(gl) {

    }
    render() {
        
    }
}

class Volume extends CLimit {
    limitType = limitTypes.volume;
    xMin = -.5;   
    xMax = .5;
    yMin = -.5;   
    yMax = .5;
    zMin = -.5;   
    zMax = .5;
    Kresti = 1;
    constructor(xMin, xMax, yMin, yMax, zMin, zMax, k) {
        super();
        this.xMin = xMin;
        this.xMax = xMax;
        this.yMin = yMin;
        this.yMax = yMax;
        this.zMin = zMin;
        this.zMax = zMax;
        this.Kresti = k;
    }
    applyLimit(s, particlePrev, particle) {
        if(particle.xPos < this.xMin) {
            particle.xPos = this.xMin;
            particle.xVel = particlePrev.xVel;
            if(particle.xVel < 0) {
                particle.xVel = -particle.xVel * this.Kresti;
            }
            else {
                particle.xVel = particle.xVel * this.Kresti;
            }
        }
        if(particle.yPos < this.yMin) {
            particle.yPos = this.yMin;
            particle.yVel = particlePrev.yVel;
            if(particle.yVel < 0) {
                particle.yVel = -particle.yVel  * this.Kresti;
            }
            else {
                particle.yVel = particle.yVel * this.Kresti;
            }
        }
        if(particle.zPos < this.zMin) {
            particle.zPos = this.zMin;
            particle.zVel = particlePrev.zVel;
            if(particle.zVel < 0) {
                particle.zVel = -particle.zVel  * this.Kresti;
            }
            else {
                particle.zVel = particle.zVel * this.Kresti;
            }
        }
        if(particle.xPos > this.xMax) {
            particle.xPos = this.xMax;
            particle.xVel = particlePrev.xVel;
            if(particle.xVel > 0) {
                particle.xVel = -particle.xVel  * this.Kresti;
            }
            else {
                particle.xVel = particle.xVel * this.Kresti;
            }
        }
        if(particle.yPos > this.yMax) {
            particle.yPos = this.yMax;
            particle.yVel = particlePrev.yVel;
            if(particle.yVel > 0) {
                particle.yVel = -particle.yVel  * this.Kresti;
            }
            else {
                particle.yVel = particle.yVel * this.Kresti;
            }
        }
        if(particle.zPos > this.zMax) {
            particle.zPos = this.zMax;
            particle.zVel = particlePrev.zVel;
            if(particle.zVel > 0) {
                particle.zVel = -particle.zVel  * this.Kresti;
            }
            else {
                particle.zVel = particle.zVel * this.Kresti;
            }
        }
    }
    initVbo(gl) {
        const vertices = makeCube(this.xMin, this.xMax, this.yMin, this.yMax, this.zMin, this.zMax);
        this.vboBox.init(gl, vertices, 16);
        this.vboBox.drawMode = gl.LINE_LOOP;
    }
    render(modelMatrix, mvpMatrix) {
        this.vboBox.switchToMe();
        this.vboBox.adjust(modelMatrix, mvpMatrix);
        this.vboBox.draw();
    }
}

class Box extends CLimit {
    limitType = limitTypes.box;
    applyLimit(s, particlePrev, particle) {
        
    }
}

class ageConstraint extends CLimit {
    limitType = limitTypes.ageConstraint;
    applyLimit(s, particlePrev, particle) {
        if(particle.age > 150) {
            particle.mass = 1;
            particle.setRandomPosition(1, [0,0,0]);
            particle.colorR = 1;
            particle.colorG = Math.random()*.7-.5*particle.xPos*particle.xPos-.5*particle.yPos*particle.yPos;
            particle.colorB = 0;
            particle.setRandomVelocity(2, [0,0, 20]);
            if(particle.zPos < 0) {
                particle.zPos = 0;
            }
            particle.age = Math.floor(Math.random() * 150);
        }
    }
}

class Rope extends CLimit {
    limitType = limitTypes.rope;
    maxDistance = 10;
    constructor(index1, index2) {
        super();
        this.e1 = index1;
        this.e2 = index2;
    }
    applyLimit(s, particlePrev, particle) {
        for(const p of s) {
            if((p.index == this.e1 && particle.index == this.e2) || (p.index == this.e2 && particle.index == this.e1)) {
                if(distance(p, particle) > this.maxDistance) {
                    const directionVec = new Vector3([p.xPos-particle.xPos, p.yPos-particle.yPos, p.zPos-particle.zPos]); //vector pointing from particle to p
                    directionVec.normalize();
                    //first, enforce the distance constraint by moving particle towards p
                    particle.xPos += directionVec.elements[0] * (distance(p,particle) - this.maxDistance);
                    particle.yPos += directionVec.elements[1] * (distance(p,particle) - this.maxDistance);
                    particle.zPos += directionVec.elements[2] * (distance(p,particle) - this.maxDistance);
                    //cancel the component of particle's velocity which is moving away from p
                    const velocityVec = new Vector3([particle.xVel, particle.yVel, particle.zVel]);
                    const reverseDirectionVec = new Vector3([-directionVec.elements[0], -directionVec.elements[1], -directionVec.elements[2]]);
                    const dotProduct = velocityVec.dot(reverseDirectionVec);
                    particle.xVel += dotProduct * directionVec.elements[0];
                    particle.yVel += dotProduct * directionVec.elements[1];
                    particle.zVel += dotProduct * directionVec.elements[2];
                    //cancel the component of p's velocity which is moving away from particle
                    const velocityVec2 = new Vector3([p.xVel, p.yVel, p.zVel]);
                    const dotProduct2 = velocityVec2.dot(directionVec);
                    p.xVel += dotProduct2 * reverseDirectionVec.elements[0];
                    p.yVel += dotProduct2 * reverseDirectionVec.elements[1];
                    p.zVel += dotProduct2 * reverseDirectionVec.elements[2];
                }
            }
        }
    }
}

class Radius extends CLimit {
    limitType = limitTypes.radius;
    minDistance = 1;
    constructor(index1, index2) {
        super();
        this.e1 = index1;
        this.e2 = index2;
    }
    //same steps as the rope constraint but in the opposite direction
    applyLimit(s, particlePrev, particle) {
        for(const p of s) {
            if((p.index == this.e1 && particle.index == this.e2) || (p.index == this.e2 && particle.index == this.e1)) {
                if(distance(p, particle) < this.minDistance) {
                    const directionVec = new Vector3([particle.xPos-p.xPos, particle.yPos-p.yPos, particle.zPos - p.zPos]); //vector pointing from p to particle
                    directionVec.normalize();
                    
                    particle.xPos += directionVec.elements[0] * (this.minDistance - distance(p, particle));
                    particle.yPos += directionVec.elements[1] * (this.minDistance - distance(p, particle));
                    particle.zPos += directionVec.elements[2] * (this.minDistance - distance(p, particle));
                    
                    const velocityVec = new Vector3([particle.xVel, particle.yVel, particle.zVel]);
                    const reverseDirectionVec = new Vector3([-directionVec.elements[0], -directionVec.elements[1], -directionVec.elements[2]]);
                    const dotProduct = velocityVec.dot(reverseDirectionVec);
                    particle.xVel += dotProduct * directionVec.elements[0];
                    particle.yVel += dotProduct * directionVec.elements[1];
                    particle.zVel += dotProduct * directionVec.elements[2];
                    
                    const velocityVec2 = new Vector3([p.xVel, p.yVel, p.zVel]);
                    const dotProduct2 = velocityVec2.dot(directionVec);
                    p.xVel += dotProduct2 * reverseDirectionVec.elements[0];
                    p.yVel += dotProduct2 * reverseDirectionVec.elements[1];
                    p.zVel += dotProduct2 * reverseDirectionVec.elements[2];
                }
            }
        }
    }
}