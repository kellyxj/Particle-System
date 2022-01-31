const forceTypes = {
    none: 0,
    earthGrav: 1
}

class CForcer {
    forceType = forceTypes.none;
    startIndex = 0;
    numParticles = -1;
}
class earthGrav extends CForcer {
    forceType = forceTypes.earthGrav;
    gravConst = 9.832;
    down = new Vector4([0, 0, -1, 1]);
}