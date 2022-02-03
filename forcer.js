const forceTypes = {
    none: 0,
    earthGrav: 1,
    spring:2,
    burner:3,
    planetGrav:4,
    drag:5,
    tornado:6
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

class Spring extends CForcer {
    forceType = forceTypes.spring;
    K_spring = 3;
    restLength = 5;
    constructor(index1, index2) {
        super();
        this.e1 = index1;
        this.e2 = index2;
    }
    applyForce(s) {
        let first = new Particle();
        let second = new Particle();
        for(const particle of s) {
            if(particle.index == this.e1) {
                first = particle;
            }
            else if(particle.index == this.e2) {
                second = particle;
            }
        }
        for(const particle of s) {
            let forceAmount = 0;
            if(particle.index == this.e1 || particle.index == this.e2) {
                forceAmount = this.K_spring * (distance(first, second) - this.restLength);
            }
            let forceDirection = new Vector3([0,0,0]);
            let relVelocity = new Vector3([0,0,0]);
            if(particle.index == this.e1) {
                forceDirection = new Vector3([second.xPos-first.xPos, second.yPos-first.yPos, second.zPos-first.zPos]);
                relVelocity = new Vector3([second.xVel-first.xVel, second.yVel-first.yVel, second.zVel-first.zVel]);
            }
            else if(particle.index == this.e2) {
                forceDirection = new Vector3([first.xPos-second.xPos, first.yPos-second.yPos, first.zPos-second.zPos]);
                relVelocity = new Vector3([first.xVel-second.xVel, first.yVel-second.yVel, first.zVel-second.zVel]);
            }
            forceDirection.normalize();
            forceDirection.elements[0] *= forceAmount;
            forceDirection.elements[1] *= forceAmount;
            forceDirection.elements[2] *= forceAmount;
            particle.xfTot += this.K_spring * forceDirection.elements[0];
            particle.yfTot += this.K_spring * forceDirection.elements[1];
            particle.zfTot += this.K_spring * forceDirection.elements[2];
        }
    }
}

class Burner extends CForcer {
    forceType = forceTypes.burner;
    applyForce(s) {
        for(const particle of s) {
            particle.age++;
            if(particle.mass > 0.001) {
                particle.mass *= .95;
            }
            if(particle.colorR > .6) {
                particle.colorR *= .99;
            }
            if(particle.colorG > .05) {
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

class Drag extends CForcer {
    forceType = forceTypes.drag;
    dragConst = .05;
    constructor(dragAmount) {
        super();
        this.dragConst = dragAmount;
    }
    applyForce(s) {
        for(const p of s) {
            p.xfTot -= (this.dragConst * p.xVel +.0001);
            p.yfTot -= (this.dragConst * p.yVel + .0001);
            p.zfTot -= (this.dragConst * p.zVel + .0001);
        }
    }
}

class Tornado extends CForcer {
    forceType = forceTypes.tornado;
    applyForce(s) {
        for(const p of s) {
            const d = Math.sqrt(Math.max(0, p.xPos*p.xPos + p.yPos*p.yPos))+.01;
            
            if(d < 2) {
                if(p.zPos < 80){
                    p.zfTot += 30;
                }
            }
            if(d < Math.min(p.zPos,20)) {
                p.xfTot += 100*p.yPos/d;
                p.yfTot -= 100*p.xPos/d;
                p.zfTot += 500/d;
            }
            else {
                p.xfTot -= 500*p.xPos/d;
                p.yfTot -= 500*p.yPos/d;
            }
            p.zfTot += 1/(p.xPos+p.yPos+.01)+4.2021; //really important magic number
            if(p.zPos < 20) {
                p.zfTot += 20;
            }
        }
    }
}