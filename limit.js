const limitTypes = {
    none: 0,
    box: 1
}

class CLimit {
    limitType = limitTypes.none;
}

class Box extends CLimit {
    limitType = limitTypes.box;
    targFirst = 0;
    targLast = -1;
    xMin = -.5;   
    xMax = .5;
    yMin = -.5;   
    yMax = .5;
    zMin = -.5;   
    zMax = .5;
    Kresti = 1;
}