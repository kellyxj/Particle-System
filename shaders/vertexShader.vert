uniform mat4 u_ModelMatrix;
uniform mat4 u_MvpMatrix;
  attribute vec4 a_Position;
  varying vec4 v_Color;
  void main() {
    gl_Position = u_MvpMatrix * u_ModelMatrix * (a_Position);
    gl_PointSize = 10.0;
    v_Color = vec4(1.0, 1.0, 1.0, 1.0);
}