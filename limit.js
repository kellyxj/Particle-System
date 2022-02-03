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
    targetList = [];
    vboBox = new VBObox();
    applyLimit(s1, particlePrev, particle) {

    }
    initVbo(gl) {

    }
    render() {
        
    }
    addTarget(p) {
        if(!this.targetList.find(index => p.index == index)) {
            this.targetList.push(p.index);
        }
    }
    addTargets(s) {
        for(const particle of s) {
            if(!this.targetList.find(index => particle.index == index)) {
                this.targetList.push(particle.index);
            }
        }
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
        if(this.targetList.length == 0 || this.targetList.find(target => target == particle.index)) {
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

class AgeConstraint extends CLimit {
    limitTypes = limitTypes.ageConstraint;
    maxAge = -1;
    constructor(max) {
        super();
        this.maxAge = max;
    }
    applyLimit(s, particlePrev, particle) {
        this.markAsKilled(particle);       //marks any particles that satisfy a certain condition to be killed and re-emited. Sets particle.age to -1 if condition is met.
        if(particle.age == -1 || (this.maxAge >0 && particle.age > this.maxAge)) {
            this.emitParticle(particle);
        }
    }
    markAsKilled(p) {

    }
    emitParticle(p) {

    }
}

class FireConstraint extends AgeConstraint {
    emitParticle(p) {
        p.mass = 1;
        p.setRandomPosition(1, [0,0,0]);
        p.colorR = 1;
        p.colorG = Math.random()*.7-.5*p.xPos*p.xPos-.5*p.yPos*p.yPos;
        p.colorB = 0;
        p.setRandomVelocity(2, [0,0, 20]);
        if(p.zPos < 0) {
            p.zPos = 0;
        }
        p.age = Math.floor(Math.random() * this.maxAge);
    }
}

class TornadoConstraint extends AgeConstraint {
    emitParticle(p) {
        p.setRandomPosition(15, [0,0,50]);
        p.setRandomVelocity(3, [0,0,0]);
        p.age = Math.floor(Math.random() * this.maxAge);
    }
}

class Annihilator extends AgeConstraint {
    constructor(xMin, xMax, yMin, yMax, zMin, zMax) {
        super();
        this.xMin = xMin;
        this.xMax = xMax;
        this.yMin = yMin;
        this.yMax = yMax;
        this.zMin = zMin;
        this.zMax = zMax;
    }
    markAsKilled(p) {
        if(p.xPos >= this.xMin && p.xPos <= this.xMax && p.yPos >= this.yMin && p.yPos <= this.yMax && p.zPos >= this.zMin && p.zPos <= this.zMax) {
            p.age = -1;
        }
    }
    emitParticle(p) {
        
    }
}

class SnowConstraint extends Annihilator {
    emitParticle(p) {
        p.age = 0;
        p.zPos = 19.9;
        if(p.zVel > 0) {
            p.zVel = 0;
        }
        if(Math.random() < .1) {
            this.targetList = this.targetList.filter(index => index == p.index);
        }
    }
}

class Rope extends CLimit {
    limitType = limitTypes.rope;
    maxDistance = 10;
    constructor(index1, index2, length) {
        super();
        this.e1 = index1;
        this.e2 = index2;
        this.maxDistance = length;
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