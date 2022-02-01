class VBObox {
    constructor() {
        this.gl;
        this.VERT_SRC = 'uniform mat4 u_ModelMatrix;\n' +
                        'uniform mat4 u_MvpMatrix;\n'+
                        'attribute vec4 a_Pos;\n'+
                        'attribute vec3 a_Colr;\n'+
                        'varying vec4 v_Color;\n'+
                        'void main() {\n'+
                            'gl_Position = u_MvpMatrix * u_ModelMatrix * (a_Pos);\n'+
                            'gl_PointSize = 10.0;\n'+
                            'v_Color = vec4(a_Colr, 1.0);\n'+
                        '}';
        this.FRAG_SRC = '//  #ifdef GL_ES\n'+
                        'precision mediump float;\n'+
                        '//  #endif GL_ES\n'+ 
                        'varying vec4 v_Color;\n'+
                        'void main() {\n'+
                        '    gl_FragColor = v_Color;\n'+
                        '}';
        this.vboContents;
        this.nVerts;
        this.FSIZE;
        this.vboBytes;
        this.vboStride; 

        this.drawMode;

        this.vboFcount_a_Pos = 4;
        this.vboFcount_a_Colr = 3;
        this.vboOffset_a_Pos = 0; 
        this.vboOffset_a_Colr;  

        this.vboLoc;									// GPU Location for Vertex Buffer Object, 

	    this.shaderLoc;								// GPU Location for compiled Shader-program  
	                            	
								          //------Attribute locations in our shaders:
	    this.a_PosLoc;								
	    this.a_ColrLoc;								

	            //---------------------- Uniform locations &values in our shaders
	    this.ModelMat = new Matrix4();
	    this.u_ModelMatLoc;							

        this.mvpMatrix = new Matrix4();
        this.u_MvpMatrixLoc;
    }

    init(gl, vboContents,n) {
        this.gl = gl;
        this.vboContents = vboContents;
        this.nVerts = n;
        this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
        this.vboBytes = this.vboContents.length * this.FSIZE;
        this.vboStride = this.vboBytes / this.nVerts; 
        this.vboOffset_a_Colr = this.vboFcount_a_Pos * this.FSIZE;
        this.shaderLoc = createProgram(this.gl, this.VERT_SRC, this.FRAG_SRC);
        if (!this.shaderLoc) {
        console.log(this.constructor.name + 
                                '.init() failed to create executable Shaders on the GPU. Bye!');
            return;
        }
    
        this.gl.program = this.shaderLoc;
    
    // b) Create VBO on GPU, fill it------------------------------------------------
        this.vboLoc = this.gl.createBuffer();	
        if (!this.vboLoc) {
            console.log(this.constructor.name + 
                                '.init() failed to create VBO in GPU. Bye!'); 
            return;
        }
      
        this.gl.bindBuffer(gl.ARRAY_BUFFER,	     
                                      this.vboLoc);				  
    
 
        this.gl.bufferData(gl.ARRAY_BUFFER, 			 
                                          this.vboContents, 		
                                       gl.STATIC_DRAW);			
      // c1) Find All Attributes:---------------------------------------------------
        this.a_PosLoc = this.gl.getAttribLocation(this.shaderLoc, 'a_Pos');
        if(this.a_PosLoc < 0) {
            console.log(this.constructor.name + 
                                '.init() Failed to get GPU location of attribute a_Pos');
            return -1;	// error exit.
        }
        this.a_ColrLoc = this.gl.getAttribLocation(this.shaderLoc, 'a_Colr');
        if(this.a_ColrLoc < 0) {
            console.log(this.constructor.name + 
                                '.init() failed to get the GPU location of attribute a_Colr');
            return -1;	// error exit.
        }
      
      // c2) Find All Uniforms:-----------------------------------------------------
      //Get GPU storage location for each uniform var used in our shader programs: 
        this.u_ModelMatLoc = this.gl.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
        if (!this.u_ModelMatLoc) { 
            console.log(this.constructor.name + 
                                '.init() failed to get GPU location for u_ModelMatrix uniform');
            return;
        }  
    
        this.u_MvpMatrixLoc = this.gl.getUniformLocation(this.shaderLoc, 'u_MvpMatrix');
        if (!this.u_MvpMatrixLoc) { 
            console.log(this.constructor.name + 
                                '.init() failed to get GPU location for u_MvpMatrix uniform');
            return;
        }  
    }

    switchToMe() {
        this.gl.useProgram(this.shaderLoc);	
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER,	        
							this.vboLoc);	

        this.gl.vertexAttribPointer(this.a_PosLoc,
                                this.vboFcount_a_Pos,// # of floats used by this attribute: 1,2,3 or 4?
                                this.gl.FLOAT,			// type
                                false,				// isNormalized
                                this.vboStride,// Stride
                                this.vboOffset_a_Pos);	
        this.gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr, 
                                                            this.gl.FLOAT, false, 
                                                            this.vboStride, this.vboOffset_a_Colr);
                                                                  
        this.gl.enableVertexAttribArray(this.a_PosLoc);
        this.gl.enableVertexAttribArray(this.a_ColrLoc);
    }

    isReady() {
        var isOK = true;
        if(this.gl.getParameter(this.gl.CURRENT_PROGRAM) != this.shaderLoc)  {
            console.log(this.constructor.name + 
                                    '.isReady() false: shader program at this.shaderLoc not in use!');
            isOK = false;
        }
        if(this.gl.getParameter(this.gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
            console.log(this.constructor.name + 
                                  '.isReady() false: vbo at this.vboLoc not in use!');
            isOK = false;
        }
        return isOK;
    }

    adjust(mvpMatrix) {
        if(this.isReady()==false) {
            console.log('ERROR! before' + this.constructor.name + 
                              '.adjust() call you needed to call this.switchToMe()!!');
        }
        
        this.ModelMat.setIdentity();
        this.gl.uniformMatrix4fv(this.u_ModelMatLoc,
            false, 				
            this.ModelMat.elements);

        this.mvpMatrix.setIdentity();
        this.mvpMatrix.set(mvpMatrix); //find a way to pass this value from main
            
        this.gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.mvpMatrix.elements);
    }

    draw() {
        if(this.isReady()==false) {
            console.log('ERROR! before' + this.constructor.name + 
                              '.draw() call you needed to call this.switchToMe()!!');
        }  

        this.gl.drawArrays(this.drawMode, 
                        0, 								
                        this.nVerts);	
    }

    reload() {
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER,
                            0,                  
                            this.vboContents); 
    }
}

function makeGroundGrid() {
    var xcount = 100;			// # of lines to draw in x,y to make the grid.
      var ycount = 100;		
      var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
       var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
       var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.
       
      // Create an (global) array to hold this ground-plane's vertices:
    var floatsPerVertex = 7;
      var gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
                          // draw a grid made of xcount+ycount lines; 2 vertices per line.
                          
      var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
      var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
      
      // First, step thru x values as we make vertical lines of constant-x:
      for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
          if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
              gndVerts[j  ] = -xymax + (v  )*xgap;	// x
              gndVerts[j+1] = -xymax;								// y
              gndVerts[j+2] = 0.0;									// z
              gndVerts[j+3] = 1.0;									// w.
          }
          else {				// put odd-numbered vertices at (xnow, +xymax, 0).
              gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
              gndVerts[j+1] = xymax;								// y
              gndVerts[j+2] = 0.0;									// z
              gndVerts[j+3] = 1.0;									// w.
          }
          gndVerts[j+4] = xColr[0];			// red
          gndVerts[j+5] = xColr[1];			// grn
          gndVerts[j+6] = xColr[2];			// blu
      }
      // Second, step thru y values as wqe make horizontal lines of constant-y:
      // (don't re-initialize j--we're adding more vertices to the array)
      for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
          if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
              gndVerts[j  ] = -xymax;								// x
              gndVerts[j+1] = -xymax + (v  )*ygap;	// y
              gndVerts[j+2] = 0.0;									// z
              gndVerts[j+3] = 1.0;									// w.
          }
          else {					// put odd-numbered vertices at (+xymax, ynow, 0).
              gndVerts[j  ] = xymax;								// x
              gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
              gndVerts[j+2] = 0.0;									// z
              gndVerts[j+3] = 1.0;									// w.
          }
          gndVerts[j+4] = yColr[0];			// red
          gndVerts[j+5] = yColr[1];			// grn
          gndVerts[j+6] = yColr[2];			// blu
      }
    return gndVerts;
  }

  function makeCube(xMin, xMax, yMin, yMax, zMin, zMax) {
      var cubeVerts = new Float32Array(7*16);
      const indices = [0, 1, 2, 3, 0, 4, 5, 1, 5, 6, 2, 6, 7, 3, 7, 4];
      for(let i = 0; i < 16; i++) {
          let xVal;
          let yVal;
          let zVal;
          if(indices[i] == 0 || indices[i] == 4 || indices[i] == 7 || indices[i] == 3 ) {
              xVal = xMax;
          }
          else {
              xVal = xMin;
          }
          if(indices[i] == 0 || indices[i] == 1 || indices[i] == 2 || indices[i] == 3) {
              yVal = yMin;
          }
          else {
              yVal = yMax;
          }
          if(indices[i] == 0 || indices[i] == 1 || indices[i] == 5 || indices[i] == 4) {
              zVal = zMax;
          }
          else {
              zVal = zMin;
          }
          cubeVerts[7*i] = xVal;
          cubeVerts[7*i+1] = yVal;
          cubeVerts[7*i+2] = zVal;
          cubeVerts[7*i+3] = 1;
          cubeVerts[7*i+4] = 1;
          cubeVerts[7*i+5] = 0;
          cubeVerts[7*i+6] = 0;
      }
      return cubeVerts;
  }