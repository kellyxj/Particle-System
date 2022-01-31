const limitTypes = {
    none: 0,
    box: 1,
    wall: 2
}

class CLimit {
    limitType = limitTypes.none;
    targFirst = 0;
    targLast = -1;
    applyLimit(particle) {

    }
}

class Box extends CLimit {
    limitType = limitTypes.box;
    xMin = -.5;   
    xMax = .5;
    yMin = -.5;   
    yMax = .5;
    zMin = -.5;   
    zMax = .5;
    Kresti = 1;
    applyLimit(particlePrev, particle) {
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
}

class Wall extends CLimit {
    limitType = limitTypes.wall;
    xMin;
    xMax;
    yMin;
    yMax;
    zMin;
    zMax;
    Kresti = 1;
}