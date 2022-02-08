const limitTypes = {
    none: 0,
    volume: 1,
    sphereVol: 2,
    cylinderVol: 3,
    ball: 4,
    cylinder: 5,
    ageConstraint: 6,
    portal: 7,
    rope: 8,
    radius:9,
    minVel:10,
    maxVel: 11,
    groundPlane: 12
}

class Limit {      //all other constraints are derived classes
    limitType = limitTypes.none;
    targetList = [];
    renderOn = true;
    vboBox = new VBObox();
    doLimit(s1, particlePrev, particle) {
        if(this.targetList.length == 0 || this.targetList.find(target => target == particle.index)) {
            this.applyLimit(s1, particlePrev, particle);
        }
    }
    applyLimit(s1, particlePrev, particle) {

    }
    initVbo(gl) {

    }
    checkRender(modelMatrix, mvpMatrix) {
        if(this.renderOn) {
            this.render(modelMatrix,mvpMatrix);
        }
    }
    render(modelMatrix, mvpMatrix) {

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

class Volume extends Limit {
    limitType = limitTypes.volume;
    xMin = -.5;   
    xMax = .5;
    yMin = -.5;   
    yMax = .5;
    zMin = -.5;   
    zMax = .5;
    K_resti = 1;
    constructor(xMin, xMax, yMin, yMax, zMin, zMax, k) {
        super();
        this.xMin = xMin;
        this.xMax = xMax;
        this.yMin = yMin;
        this.yMax = yMax;
        this.zMin = zMin;
        this.zMax = zMax;
        this.K_resti = k;
    }
    applyLimit(s, particlePrev, particle) {
        if(particle.xPos < this.xMin) {
            particle.xPos = this.xMin;
            particle.xVel = particlePrev.xVel;
            if(particle.xVel < 0) {
                particle.xVel = -particle.xVel * this.K_resti;
            }
            else {
                particle.xVel = particle.xVel * this.K_resti;
            }
        }
        if(particle.yPos < this.yMin) {
            particle.yPos = this.yMin;
            particle.yVel = particlePrev.yVel;
            if(particle.yVel < 0) {
                particle.yVel = -particle.yVel  * this.K_resti;
            }
            else {
                    particle.yVel = particle.yVel * this.K_resti;
            }
        }
        if(particle.zPos < this.zMin) {
            particle.zPos = this.zMin;
            particle.zVel = particlePrev.zVel;
            if(particle.zVel < 0) {
                particle.zVel = -particle.zVel  * this.K_resti;
            }
            else {
                particle.zVel = particle.zVel * this.K_resti;
            }
        }
        if(particle.xPos > this.xMax) {
            particle.xPos = this.xMax;
            particle.xVel = particlePrev.xVel;
            if(particle.xVel > 0) {
                particle.xVel = -particle.xVel  * this.K_resti;
            }
            else {
                particle.xVel = particle.xVel * this.K_resti;
            }
        }
        if(particle.yPos > this.yMax) {
            particle.yPos = this.yMax;
            particle.yVel = particlePrev.yVel;
            if(particle.yVel > 0) {
                particle.yVel = -particle.yVel  * this.K_resti;
            }
            else {
                particle.yVel = particle.yVel * this.K_resti;
            }
        }
        if(particle.zPos > this.zMax) {
            particle.zPos = this.zMax;
            particle.zVel = particlePrev.zVel;
            if(particle.zVel > 0) {
                particle.zVel = -particle.zVel  * this.K_resti;
            }
            else {
                particle.zVel = particle.zVel * this.K_resti;
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

class SphereVol extends Limit {
    limitType = limitTypes.sphereVol;
    constructor(r,center,k) {
        super();
        this.radius = r;
        this.K_resti = k;
        this.centerX = center[0];
        this.centerY = center[1];
        this.centerZ = center[2];
    }
    applyLimit(s, particlePrev, particle) {
        const directionVec = new Vector3([this.centerX - particle.xPos, this.centerY - particle.yPos, this.centerZ- particle.zPos]);
        const d = Math.sqrt(directionVec.dot(directionVec));
        if(d > this.radius) {
            directionVec.normalize();
            particle.xPos += (d-this.radius) * directionVec.elements[0];
            particle.yPos += (d-this.radius) * directionVec.elements[1];
            particle.zPos += (d-this.radius) * directionVec.elements[2];
            const reverseDirectionVec = new Vector3([-directionVec.elements[0], -directionVec.elements[1], -directionVec.elements[2]]);
            const velocityVec = new Vector3([particle.xVel, particle.yVel, particle.zVel]);
            const dotProduct = velocityVec.dot(reverseDirectionVec);
            particle.xVel += 2 * this.K_resti * dotProduct * directionVec.elements[0];
            particle.yVel += 2 * this.K_resti * dotProduct * directionVec.elements[1];
            particle.zVel += 2 * this.K_resti * dotProduct * directionVec.elements[2];
        }
    }
    initVbo(gl) {
        const vertices = makeSphere(this.radius, [this.centerX, this.centerY, this.centerZ], [0, .2, 1]);
        this.vboBox.init(gl, vertices, vertices.length/7);
        this.vboBox.drawMode = gl.LINE_LOOP;
    }
    render(modelMatrix, mvpMatrix) {
        this.vboBox.switchToMe();
        this.vboBox.adjust(modelMatrix, mvpMatrix);
        this.vboBox.draw();
    }
}

class CylinderVol extends Limit {
    limitType = limitTypes.cylinderVol;
    constructor(r, center, h, k) {      //here, "center" means center of the bottom face of the cylinder
        super();
        this.radius = r;
        this.height = h;
        this.centerX = center[0];
        this.centerY = center[1];
        this.centerZ = center[2];
        this.K_resti = k;
    }
    applyLimit(s, particlePrev, particle) {
        if(particle.zPos < this.centerZ) {
            particle.zPos = this.centerZ;
            if(particle.zVel < 0) {
                particle.zVel = -this.K_resti * particle.zVel;
            }
            else {
                particle.zVel = this.K_resti * particle.zVel;
            }
        }
        if(particle.zPos > this.centerZ+this.height) {
            particle.zPos = this.centerZ+this.height;
            if(particle.zVel > 0) {
                particle.zVel = -this.K_resti * particle.zVel;
            }
            else {
                particle.zVel = this.K_resti * particle.zVel;
            }
        }
        const directionVec = new Vector3([this.centerX-particle.xPos, this.centerY-particle.yPos, 0]);
        const d = Math.sqrt(directionVec.dot(directionVec));
        if(d > this.radius) {
            directionVec.normalize();
            particle.xPos += (d-this.radius) * directionVec.elements[0];
            particle.yPos += (d-this.radius) * directionVec.elements[1];

            const reverseDirectionVec = new Vector3([-directionVec.elements[0], -directionVec.elements[1], 0]);
            const velocityVec = new Vector3([particle.xVel, particle.yVel, 0]);
            const dotProduct = velocityVec.dot(reverseDirectionVec);
            particle.xVel += 2 * this.K_resti * dotProduct * directionVec.elements[0];
            particle.yVel += 2 * this.K_resti * dotProduct * directionVec.elements[1];
            particle.zVel += 2 * this.K_resti * dotProduct * directionVec.elements[2];
        }
    }
    initVbo(gl) {
        const vertices = makeCylinder(this.radius, [this.centerX, this.centerY, this.centerZ], this.height, [0, .2, 1]);
        this.vboBox.init(gl, vertices, vertices.length/7);
        this.vboBox.drawMode = gl.LINE_LOOP;
    }
    render(modelMatrix, mvpMatrix) {
        this.vboBox.switchToMe();
        this.vboBox.adjust(modelMatrix, mvpMatrix);
        this.vboBox.draw();
    }
}

class Ball extends Limit {
    limitType = limitTypes.ball;
    constructor(r, center, k) {
        super();
        this.radius = r;
        this.K_resti = k;
        this.centerX = center[0];
        this.centerY = center[1];
        this.centerZ = center[2];
    }
    applyLimit(s, particlePrev, particle) {
        const directionVec = new Vector3([particle.xPos- this.centerX, particle.yPos - this.centerY, particle.zPos- this.centerZ]);
        const d = Math.sqrt(directionVec.dot(directionVec));
        if(d < this.radius) {
            directionVec.normalize();
            particle.xPos += (this.radius - d) * directionVec.elements[0];
            particle.yPos += (this.radius - d) * directionVec.elements[1];
            particle.zPos += (this.radius - d) * directionVec.elements[2];
            const reverseDirectionVec = new Vector3([-directionVec.elements[0], -directionVec.elements[1], -directionVec.elements[2]]);
            const velocityVec = new Vector3([particle.xVel, particle.yVel, particle.zVel]);
            const dotProduct = velocityVec.dot(reverseDirectionVec);
            particle.xVel += 2 * this.K_resti * dotProduct * directionVec.elements[0];
            particle.yVel += 2 * this.K_resti * dotProduct * directionVec.elements[1];
            particle.zVel += 2 * this.K_resti * dotProduct * directionVec.elements[2];
        }
    }
    initVbo(gl) {
        const vertices = makeSphere(this.radius, [this.centerX, this.centerY, this.centerZ], [1,1,1]);
        this.vboBox.init(gl, vertices, vertices.length/7);
        this.vboBox.drawMode = gl.LINE_LOOP;
    }
    render(modelMatrix, mvpMatrix) {
        this.vboBox.switchToMe();
        this.vboBox.adjust(modelMatrix, mvpMatrix);
        this.vboBox.draw();
    }
}

class Cylinder extends Limit {
    limitType = limitTypes.cylinder;
    constructor(r, center, h, k) {      //here, "center" means center of the bottom face of the cylinder
        super();
        this.radius = r;
        this.height = h;
        this.centerX = center[0];
        this.centerY = center[1];
        this.centerZ = center[2];
        this.K_resti = k;
    }
    applyLimit(s, particlePrev, particle) {
        const directionVec = new Vector3([particle.xPos-this.centerX, particle.yPos-this.centerY, 0]);
        const d = Math.sqrt(directionVec.dot(directionVec));
        if(d < this.radius && particle.zPos >= this.centerZ && particle.zPos <= this.centerZ+this.height) {
            directionVec.normalize();
            particle.xPos += (this.radius-d) * directionVec.elements[0];
            particle.yPos += (this.radius-d) * directionVec.elements[1];

            const reverseDirectionVec = new Vector3([-directionVec.elements[0], -directionVec.elements[1], 0]);
            const velocityVec = new Vector3([particle.xVel, particle.yVel, 0]);
            const dotProduct = velocityVec.dot(reverseDirectionVec);
            particle.xVel += 2 * this.K_resti * dotProduct * directionVec.elements[0];
            particle.yVel += 2 * this.K_resti * dotProduct * directionVec.elements[1];
            particle.zVel += 2 * this.K_resti * dotProduct * directionVec.elements[2];
        }
    }
    initVbo(gl) {
        const vertices = makeCylinder(this.radius, [this.centerX, this.centerY, this.centerZ], this.height, [1, 1, 1]);
        this.vboBox.init(gl, vertices, vertices.length/7);
        this.vboBox.drawMode = gl.LINE_LOOP;
    }
    render(modelMatrix, mvpMatrix) {
        this.vboBox.switchToMe();
        this.vboBox.adjust(modelMatrix, mvpMatrix);
        this.vboBox.draw();
    }
}

class AgeConstraint extends Limit {
    limitType = limitTypes.ageConstraint;
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
    setInitPos(randAmount, pos) {
        this.initial = true;
        this.initialPosition = pos;
        this.randPos = randAmount;
    }
    setInitVel(randAmount, vel) {
        this.initVel = vel;
        this.randVel = randAmount;
    }
    markAsKilled(p) {

    }
    emitParticle(p) {

    }
}

class FireConstraint extends AgeConstraint {
    emitParticle(p) {
        p.mass = 1;
        p.setRandomPosition(this.randPos, this.initialPosition);
        p.zPos = 0;
        p.colorR = 1;
        p.colorG = Math.random()*.7-.5*p.xPos*p.xPos-.5*p.yPos*p.yPos;
        p.colorB = 0;
        p.setRandomVelocity(this.randVel, this.initVel);
        p.age = Math.floor(Math.random() * this.maxAge);
    }
}

class TornadoConstraint extends AgeConstraint {
    emitParticle(p) {
        p.setRandomPosition(this.randPos, this.initialPosition);
        p.zPos=0;
        p.setRandomVelocity(this.randVel, this.initVel);
        p.age = Math.floor(Math.random() * this.maxAge);
    }
}

class Portal extends AgeConstraint {        //default behavior: particles that moved into the portal get translated by translationVec.
    limitType = limitTypes.portal;
    constructor(xMin, xMax, yMin, yMax, zMin, zMax, translate) {
        super();
        this.xMin = xMin;
        this.xMax = xMax;
        this.yMin = yMin;
        this.yMax = yMax;
        this.zMin = zMin;
        this.zMax = zMax;
        this.translationVec = translate;
    }
    markAsKilled(p) {
        if(this.targetList.length == 0 || this.targetList.find(index => index == p.index)) {
            if(p.xPos >= this.xMin && p.xPos <= this.xMax && p.yPos >= this.yMin && p.yPos <= this.yMax && p.zPos >= this.zMin && p.zPos <= this.zMax) {
                p.age = -1;
            }
        }
    }
    
    emitParticle(p) {
        p.age = 0;
        if(this.initial) {      //can use setInitPos to override default behavior. Instead, all particles that enter the portal are sent to initialPosition.
            p.xPos = this.initialPosition[0];
            p.yPos = this.initialPosition[1];
            p.zPos = this.initialPosition[2];
        }
        else {
            p.xPos += this.translationVec[0];
            p.yPos += this.translationVec[1];
            p.zPos += this.translationVec[2];
        }
    }
}

class Rope extends Limit {
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

class Radius extends Limit {
    limitType = limitTypes.radius;
    minDistance = 1;
    constructor(index1, index2, r) {
        super();
        this.e1 = index1;
        this.e2 = index2;
        this.minDistance = r;
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

class MinVel extends Limit {
    limitType = limitTypes.minVel;
    minVel = 1;
    constructor(min) {
        super()
        this.minVel = min;
    }
    applyLimit(s, particlePrev, particle) {
        const squareVel = particle.xVel * particle.xVel + particle.yVel * particle.yVel + particle.zVel * particle.zVel;
        if(squareVel < this.minVel * this.minVel) {
            const scaleAmount = Math.sqrt(this.minVel * this.minVel / (squareVel + 0.0001));
            particle.xVel *= scaleAmount;
            particle.yVel *= scaleAmount;
            particle.zVel *= scaleAmount;
        }
    }
}

class MaxVel extends Limit {
    limitType = limitTypes.maxVel;
    maxVel = 10;
    constructor(max) {
        super()
        this.maxVel = max;
    }
    applyLimit(s, particlePrev, particle) {
        const squareVel = particle.xVel * particle.xVel + particle.yVel * particle.yVel + particle.zVel * particle.zVel;
        if(squareVel > this.maxVel * this.maxVel) {
            const scaleAmount = Math.sqrt(this.maxVel * this.maxVel  / (squareVel+ 0.0001));
            particle.xVel *= scaleAmount;
            particle.yVel *= scaleAmount;
            particle.zVel *= scaleAmount;
        }
    }
}

class GroundPlane extends Limit {
    limitType = limitTypes.groundPlane;
    applyLimit(s, particle, particlePrev) {
        if(particle.zPos < 0) {
            particle.zPos = 0;
            particle.zVel = particlePrev.zVel;
            if(particle.zVel < 0) {
                particle.zVel = -particle.zVel;
            }
            else {
                particle.zVel = particle.zVel;
            }
        }
    }
}