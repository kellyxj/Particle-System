const forceTypes = {
    none: 0,
    earthGrav: 1,
    spring:2,
    burner:3,
    planetGrav:4
}

class CForcer {
    forceType = forceTypes.none;
    startIndex = 0;
    numParticles = -1;
    applyForce(s) {

    }
}
class earthGrav extends CForcer {
    forceType = forceTypes.earthGrav;
    gravConst = 9.832;
    down = new Vector4([0, 0, -1, 1]);
    applyForce(s) {
        for(const particle of s) {
            particle.xfTot += particle.mass * this.gravConst * this.down.elements[0];
            particle.yfTot += particle.mass * this.gravConst * this.down.elements[1];
            particle.zfTot += particle.mass * this.gravConst * this.down.elements[2];
        }
    }
}

class spring extends CForcer {
    forceType = forceTypes.spring;
    K_spring = 1;
    restLength = 1;
    constructor(index1, index2) {
        super();
        this.e1 = index1;
        this.e2 = index2;
    }
    applyForce(s) {
        const first = s[this.e1];
        const second = s[this.e2];
        for(const particle of s) {
            let forceAmount = 0;
            if(particle.index == this.e1 || particle.index == this.e2) {
                forceAmount = this.K_spring * (distance(first, second) - this.restLength);
            }
            let forceDirection = new Vector3([0,0,0]);
            if(particle.index == this.e1) {
                forceDirection = new Vector3([second.xPos-first.xPos, second.yPos-first.yPos, second.zPos-first.zPos]);
            }
            else if(particle.index == this.e2) {
                forceDirection = new Vector3([first.xPos-second.xPos, first.yPos-second.yPos, first.zPos-second.zPos]);
            }
            forceDirection.normalize();
            forceDirection.elements[0] *= forceAmount;
            forceDirection.elements[1] *= forceAmount;
            forceDirection.elements[2] *= forceAmount;
            particle.xfTot += forceDirection.elements[0];
            particle.yfTot += forceDirection.elements[1];
            particle.zfTot += forceDirection.elements[2];
        }
    }
}

class burner extends CForcer {
    forceType = forceTypes.burner;
    applyForce(s) {
        for(const particle of s) {
            particle.age++;
            particle.mass *= .99;
            if(particle.colorR > .7) {
                particle.colorR *= .99;
            }
            if(particle.colorG > .1) {
                particle.colorG *= .99;
            }
        }
    }
}

class planetGrav extends CForcer {
    forceType = forceTypes.planetGrav;
    gravConst = 6.674e-11;
    applyForce(s) {
        for(const p1 of s) {
            for(const p2 of s) {
                if(p1.index != p2.index) {
                    const directionVec = new Vector3([p2.xPos-p1.xPos, p2.yPos-p1.yPos, p2.zPos-p1.zPos]);
                    const squareDistance = Math.max(directionVec.dot(directionVec), .0001);
                    directionVec.normalize();
                    p1.xfTot += this.gravConst * directionVec.elements[0] * p1.mass * p2.mass / squareDistance;
                    p1.yfTot += this.gravConst * directionVec.elements[1] * p1.mass * p2.mass / squareDistance;
                    p1.zfTot += this.gravConst * directionVec.elements[2] * p1.mass * p2.mass / squareDistance;
                    p2.xfTot += this.gravConst * -directionVec.elements[0] * p1.mass * p2.mass / squareDistance;
                    p2.yfTot += this.gravConst * -directionVec.elements[1] * p1.mass * p2.mass / squareDistance;
                    p2.zfTot += this.gravConst * -directionVec.elements[2] * p1.mass * p2.mass / squareDistance;
                }
            }
        }
    }
}