const forceTypes = {
    none: 0,
    earthGrav: 1,
    wind:2,
    spring:3,
    springSet:4,
    ager:5,
    planetGrav:6,
    drag:7,
    turbulence:8,
    tornado:9,
    brownian:10,
    aligner:11
}

class Forcer {
    forceType = forceTypes.none;
    targetList = [];        //indices of all particles that the force should be applied to
    renderOn = true;
    vboBox = new VBObox();
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
    initVbo(gl) {

    }
    checkRender(modelMatrix, mvpMatrix) {
        if(this.renderOn) {
            this.render(modelMatrix, mvpMatrix);
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
class earthGrav extends Forcer {
    forceType = forceTypes.earthGrav;
    gravConst = 9.832;
    down = new Vector4([0, 0, -1, 0]);
    applyForce(particle) {
        particle.xfTot += particle.mass * this.gravConst * this.down.elements[0];
        particle.yfTot += particle.mass * this.gravConst * this.down.elements[1];
        particle.zfTot += particle.mass * this.gravConst * this.down.elements[2];
    }
}

class Wind extends Forcer {
    forceType = forceTypes.wind;
    windAmount = 10;
    windDirection = new Vector4([0, -1, 0, 0]);
    randAmount = 1;
    constructor(windAmount, randAmount) {
        super();
        this.windAmount = windAmount;
        this.randAmount = randAmount;
    }
    applyForce(particle) {
        particle.xfTot += this.windAmount * this.windDirection.elements[0] + (2*Math.random()-1) * this.randAmount;
        particle.yfTot += this.windAmount * this.windDirection.elements[1] + (2*Math.random()-1) * this.randAmount;
        particle.zfTot += this.windAmount * this.windDirection.elements[2] + (2*Math.random()-1) * this.randAmount;
    }
}

class Spring extends Forcer {
    forceType = forceTypes.spring;
    K_spring = 3;
    restLength = 5;
    K_damp = .4;
    position1;
    position2;
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
                this.position1 = [particle.xPos, particle.yPos, particle.zPos, particle.wPos];
            }
            else if(particle.index == this.e2) {
                second = particle;
                this.position2 = [particle.xPos, particle.yPos, particle.zPos, particle.wPos];
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
    initVbo(gl) {
        const vertices = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        this.vboBox.init(gl, vertices, 2);
        this.vboBox.drawMode = gl.LINES;
    }
    render(modelMatrix, mvpMatrix) {
        this.vboBox.switchToMe();
        const vertices = new Float32Array([this.position1[0], this.position1[1], this.position1[2], this.position1[3], 1, 1, 1,
                                            this.position2[0], this.position2[1], this.position2[2],this.position2[3], 1, 1, 1]);
        this.vboBox.vboContents = vertices;
        this.vboBox.reload();
        this.vboBox.adjust(modelMatrix, mvpMatrix);
        this.vboBox.draw();
    }
}

class SpringSet extends Forcer {
    forceType = forceTypes.springSet;
    springs = [];
    renderOn = true;
    constructor(K_spring, restLength, K_damp) {
        super();
        this.K_spring = K_spring;
        this.restLength = restLength;
        this.K_damp = K_damp;
    }
    makeSpring(index1, index2) {
        const s = new Spring(index1, index2, this.K_spring, this.restLength, this.K_damp);
        this.springs.push(s);
    }
    calcForce(s) {
        for(const spring of this.springs) {
            spring.calcForce(s);
        }
    }
    initVbo(gl) {
        for(const spring of this.springs) {
            spring.initVbo(gl);
        }
    }
    render(modelMatrix, mvpMatrix) {
        if(this.renderOn) {
            for(const spring of this.springs) {
                spring.render(modelMatrix, mvpMatrix);
            }
        }
    }
}

class Ager extends Forcer {
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
        if(particle.colorR > .2) {
            particle.colorR *= .99;
        }
        if(particle.colorG > .01) {
            particle.colorG *= .98;
        }
    }
}

class planetGrav extends Forcer {
    forceType = forceTypes.planetGrav;
    gravConst = 6.674e-11;
    maxRange = Infinity;
    constructor(gravConst, range) {
        super();
        this.gravConst = gravConst;
        this.maxRange = range;
    }
    calcForce(s) {
        for(const p1 of s) {
            for(const p2 of s) {
                if(p1.index != p2.index && distance(p1,p2) < this.maxRange) {
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

class Drag extends Forcer {        //laminar flow: drag force proportional to -velocity
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

class Turbulence extends Forcer {      //turbulent flow: drag force proportional to -velocity^2
    forceType = forceTypes.turbulence;
    turbulence = .01;
    minVel = 100;
    constructor(dragAmount, minVel) {
        super();
        this.dragConst = dragAmount;
        this.minVel = minVel;
    }
    applyForce(p) {
        if (p.xVel * p.xVel + p.yVel * p.yVel + p.zVel * p.zVel > this.minVel){
            if(p.xVel > 0) {
                p.xfTot -= (this.turbulence * p.xVel * p.xVel +.0001);
            }
            else {
                p.xfTot += (this.turbulence * p.xVel * p.xVel +.0001);
            }
            if(p.yVel > 0) {
                p.yfTot -= (this.turbulence * p.yVel * p.yVel +.0001);
            }
            else {
                p.yfTot += (this.turbulence * p.yVel * p.yVel +.0001);
            }
            if(p.zVel > 0) {
                p.zfTot -= (this.turbulence * p.zVel * p.zVel +.0001);
            }
            else {
                p.zfTot += (this.turbulence * p.zVel * p.zVel +.0001);
            }
        }
    }
}

class Tornado extends Forcer {
    forceType = forceTypes.tornado;
    cohesion = 500;
    updraft = 30;
    circulation = 100;
    applyForce(p) {
        const d = Math.sqrt(Math.max(0, p.xPos*p.xPos + p.yPos*p.yPos))+.01;
            
        if(d < 2) {
            if(p.zPos < 80){
                p.zfTot += this.updraft;
            }
        }
        if(d < Math.max(10,(p.zPos * p.zPos)/500)) {
            p.xfTot += this.circulation*p.yPos/d;
            p.yfTot -= this.circulation*p.xPos/d;
            p.zfTot += 16*this.updraft/d;
        }
        else {
            p.xfTot -= this.cohesion*p.xPos/d;
            p.yfTot -= this.cohesion*p.yPos/d;
        }
        p.zfTot += 1/(p.xPos+p.yPos+.01)+4.2021;
        if(p.zPos < 5) {
            p.zfTot = 0;
        }
    }
}

class Brownian extends Forcer {
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

class Aligner extends Forcer{
    forceType = forceTypes.aligner;
    alignConst = 0;
    maxRange = Infinity;
    constructor(alignConst, range, fov) {
        super();
        this.alignConst = alignConst;
        this.maxRange = range;
        this.fov = fov;
    }
    calcForce(s) {
        for(const p1 of s) {
            for(const p2 of s) {
                if(p1.index != p2.index && distance(p1,p2) < this.maxRange) {
                    const directionVec = new Vector3([p2.xPos-p1.xPos, p2.yPos-p1.yPos, p2.zPos-p1.zPos]);
                    const squareDistance = Math.max(directionVec.dot(directionVec), .0001);
                    const velocityVec = new Vector3([p1.xVel, p1.yVel, p2.yVel]);
                    directionVec.normalize();
                    velocityVec.normalize();
                    
                    if(velocityVec.dot(directionVec) > Math.cos(2 * this.fov * Math.PI/180)) {
                        p1.xfTot += this.alignConst * p2.xVel / squareDistance;
                        p1.yfTot += this.alignConst * p2.yVel / squareDistance;
                        p1.zfTot += this.alignConst * p2.zVel / squareDistance;
                    }
                }
            }
        }
    }
}