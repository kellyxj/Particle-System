const forceTypes = {
    none: 0,
    earthGrav: 1
}

class CForcer {
    forceType = forceTypes.none;
    startIndex = 0;
    numParticles = -1;
    applyForce(particle) {

    }
}
class earthGrav extends CForcer {
    forceType = forceTypes.earthGrav;
    gravConst = 9.832;
    down = new Vector4([0, 0, -1, 1]);
    applyForce(particle) {
        particle.xfTot += particle.mass * this.gravConst * this.down.elements[0];
        particle.yfTot += particle.mass * this.gravConst * this.down.elements[1];
        particle.zfTot += particle.mass * this.gravConst * this.down.elements[2];
    }
}