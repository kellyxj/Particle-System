const limitTypes = {
    none: 0,
    volume: 1,
    ageConstraint: 2,
    radius: 3
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
                particle.xVel = particle.yVel * this.Kresti;
            }
        }
        if(particle.zPos < this.zMin) {
            particle.zPos = this.zMin;
            particle.zVel = particlePrev.zVel;
            if(particle.zVel < 0) {
                particle.zVel = -particle.zVel  * this.Kresti;
            }
            else {
                particle.xVel = particle.zVel * this.Kresti;
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
                particle.xVel = particle.yVel * this.Kresti;
            }
        }
        if(particle.zPos > this.zMax) {
            particle.zPos = this.zMax;
            particle.zVel = particlePrev.zVel;
            if(particle.zVel > 0) {
                particle.zVel = -particle.zVel  * this.Kresti;
            }
            else {
                particle.xVel = particle.zVel * this.Kresti;
            }
        }
    }
    initVbo(gl) {
        const vertices = makeCube(this.xMin, this.xMax, this.yMin, this.yMax, this.zMin, this.zMax);
        this.vboBox.init(gl, vertices, 16);
        this.vboBox.drawMode = gl.LINE_LOOP;
    }
    render(mvpMatrix) {
        this.vboBox.switchToMe();
        this.vboBox.adjust(mvpMatrix);
        this.vboBox.draw();
    }
}

class ageConstraint extends CLimit {
    limitType = limitTypes.ageConstraint;
    applyLimit(s, particlePrev, particle) {
        if(particle.age > 200) {
            particle.setRandomPosition(2, [0,0,0]);
            particle.colorR = 1;
            particle.colorG = Math.random()*.8-.1*particle.xPos*particle.xPos-.1*particle.yPos*particle.yPos;
            particle.colorB = 0;
            particle.setRandomVelocity(1, [0,0,6]);
            if(particle.zPos < 0) {
                particle.zPos = 0;
            }
            particle.age = Math.floor(Math.random() * 200);
        }
    }
}

class Radius extends CLimit {
    limitType = limitTypes.radius;
    radius = .1;
    applyLimit(s, particlePrev, particle) {
        for(const p of s) {
            if(particle.index != p.index) {
                if(distance(particle, p) < this.radius) {
                    const sizeOfMove = this.radius-distance(particle,p);
                    const directionOfMove = [particle.xPos-p.xPos, particle.yPos-p.yPos, particle.zPos-p.zPos];
                    particle.xPos += sizeOfMove * directionOfMove[0];
                    particle.yPos += sizeOfMove * directionOfMove[1];
                    particle.zPos += sizeOfMove * directionOfMove[2];
                }
            }
        }
    }
}