const forceTypes = {
    none: 0,
    earthGrav: 1,
    wind:2,
    spring:3,
    ager:4,
    planetGrav:5,
    drag:6,
    tornado:7,
    brownian:8
}

class CForcer {
    forceType = forceTypes.none;
    targetList = [];        //indices of all particles that the force should be applied to
    constructor(targets) {
        if(targets) {
            this.addTargets(targets);
        }
    }
    calcForce(s) {
        for(const particle of s) {
            if(this.targetList.length == 0 || this.targetList.find(index => index = particle.index)) {
                this.applyForce(particle);
            }
        }
    }
    applyForce(particle) {

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
class earthGrav extends CForcer {
    forceType = forceTypes.earthGrav;
    gravConst = 9.832;
    down = new Vector4([0, 0, -1, 0]);
    applyForce(particle) {
        particle.xfTot += particle.mass * this.gravConst * this.down.elements[0];
        particle.yfTot += particle.mass * this.gravConst * this.down.elements[1];
        particle.zfTot += particle.mass * this.gravConst * this.down.elements[2];
    }
}

class Wind extends CForcer {
    forceType = forceTypes.wind;
    windAmount = 10;
    windDirection = new Vector4([0, -1, 0, 0]);
    turbulence = 1;
    constructor(windAmount, turbulence) {
        super();
        this.windAmount = windAmount;
        this.turbulence = turbulence;
    }
    applyForce(particle) {
        particle.xfTot += this.windAmount * this.windDirection.elements[0] + Math.random() * this.turbulence;
        particle.yfTot += this.windAmount * this.windDirection.elements[1] + Math.random() * this.turbulence;
        particle.zfTot += this.windAmount * this.windDirection.elements[2] + Math.random() * this.turbulence;
    }
}

class Spring extends CForcer {
    forceType = forceTypes.spring;
    K_spring = 3;
    restLength = 5;
    K_damp = .4;
    constructor(index1, index2, K_spring, restLength, K_damp) {
        super();
        this.e1 = index1;
        this.e2 = index2;
        this.K_spring = K_spring;
        this.restLength = restLength;
        this.K_damp = K_damp;
    }
    calcForce(s) {
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
            const dotProduct = forceDirection.dot(relVelocity);
            forceDirection.elements[0] *= forceAmount;
            forceDirection.elements[1] *= forceAmount;
            forceDirection.elements[2] *= forceAmount;
            particle.xfTot += this.K_spring * forceDirection.elements[0];
            particle.yfTot += this.K_spring * forceDirection.elements[1];
            particle.zfTot += this.K_spring * forceDirection.elements[2];
            forceDirection.normalize();
            particle.xfTot -= dotProduct * this.K_damp * forceDirection.elements[0];
            particle.yfTot -= dotProduct * this.K_damp * forceDirection.elements[1];
            particle.zfTot -= dotProduct * this.K_damp * forceDirection.elements[2];
        }
    }
}

class Ager extends CForcer {
    forceType = forceTypes.ager;
    applyForce(particle) {
        this.setAge(particle);
        this.setMass(particle);
        this.setColor(particle);
    }
    setAge(particle) {
        particle.age++;
    }
    setMass(particle) {

    }
    setColor(particle) {

    }
}

class Burner extends Ager {
    setMass(particle) {
        if(particle.mass > 0.001) {
            particle.mass *= .95;
        }
    }
    setColor(particle) {
        if(particle.colorR > .6) {
            particle.colorR *= .99;
        }
        if(particle.colorG > .05) {
            particle.colorG *= .99;
        }
    }
}

class planetGrav extends CForcer {
    forceType = forceTypes.planetGrav;
    gravConst = 6.674e-11;
    constructor(gravConst) {
        super();
        this.gravConst = gravConst;
    }
    calcForce(s) {
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
    applyForce(p) {
        p.xfTot -= (this.dragConst * p.xVel +.0001);
        p.yfTot -= (this.dragConst * p.yVel + .0001);
        p.zfTot -= (this.dragConst * p.zVel + .0001);
    }
}

class Tornado extends CForcer {
    forceType = forceTypes.tornado;
    applyForce(p) {
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
        p.zfTot += 1/(p.xPos+p.yPos+.01)+4.2021;
        if(p.zPos < 20) {
            p.zfTot += 20;
        }
    }
}

class Brownian extends CForcer {
    forceType = forceTypes.brownian;
    frequency = .1;
    maxForce = .1;
    constructor(freq, max) {
        super();
        this.frequency = freq;
        this.maxForce = max;
    }
    applyForce(p) {
        if(Math.random() < this.frequency) {
            p.xfTot += this.maxForce * (2*Math.random()-1);
            p.yfTot += this.maxForce * (2*Math.random()-1);
            p.zfTot += this.maxForce * (2*Math.random()-1);
        }
    }
}