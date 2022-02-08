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
                            'v_Color = vec4(a_Colr, 1);\n'+
                        '}';
        this.FRAG_SRC = '//  #ifdef GL_ES\n'+
                        'precision mediump float;\n'+
                        '//  #endif GL_ES\n'+ 
                        'varying vec4 v_Color;\n'+
                        'void main() {\n'+
                        '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' +
                        '  if(dist < 0.5) { \n' +	
                        '       gl_FragColor = vec4(v_Color.rgb,1);\n' +
                        '  } else { discard; }\n' +
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

    adjust(modelMatrix, mvpMatrix) {
        if(this.isReady()==false) {
            console.log('ERROR! before' + this.constructor.name + 
                              '.adjust() call you needed to call this.switchToMe()!!');
        }
        
        this.ModelMat.setIdentity();
        this.ModelMat.set(modelMatrix);
        this.gl.uniformMatrix4fv(this.u_ModelMatLoc,
            false, 				
            this.ModelMat.elements);

        this.mvpMatrix.setIdentity();
        this.mvpMatrix.set(mvpMatrix);
            
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

function makeSphere(r, center, colorVec) {
        //==============================================================================
        // Make a sphere from one TRIANGLE_STRIP drawing primitive,  using the
        // 'stepped spiral' design (Method 2) described in the class lecture notes.   
        // Sphere radius==1.0, centered at the origin, with 'south' pole at 
        // (x,y,z) = (0,0,-1) and 'north' pole at (0,0,+1).  The tri-strip starts at the
        // south-pole end-cap spiraling upwards (in +z direction) in CCW direction as  
        // viewed from the origin looking down (from inside the sphere). 
        // Between the south end-cap and the north, it creates ring-like 'slices' that 
        // defined by parallel planes of constant z.  Each slice of the tri-strip 
        // makes up an equal-lattitude portion of the sphere, and the stepped-spiral
        // slices follow the same design used to the makeCylinder2() function.
        //
        // (NOTE: you'll get better-looking results if you create a 'makeSphere3() 
        // function that uses the 'degenerate stepped spiral' design (Method 3 in 
        // lecture notes).
        //
        
          var slices =12;		// # of slices of the sphere along the z axis, including 
                                              // the south-pole and north pole end caps. ( >=2 req'd)
          var sliceVerts	= 21;	// # of vertices around the top edge of the slice
                                                // (same number of vertices on bottom of slice, too)
                                                // (HINT: odd# or prime#s help avoid accidental symmetry)
          var topColr = new Float32Array([1.0, 1.0, 1.0]);	// South Pole: dark-gray
          var botColr = new Float32Array([1.0, 1.0, 1.0]);	// North Pole: light-gray.
          var errColr = new Float32Array(colorVec);	// Bright-red trouble colr
          var sliceAngle = Math.PI/slices;	// One slice spans this fraction of the 
          // 180 degree (Pi radian) lattitude angle between south pole and north pole.
        
            // Create a (global) array to hold this sphere's vertices:
            var floatsPerVertex = 7;
         var sphVerts = new Float32Array(  ((slices*2*sliceVerts) -2) * floatsPerVertex);
                                                // # of vertices * # of elements needed to store them. 
                                                // Each end-cap slice requires (2*sliceVerts -1) vertices 
                                                // and each slice between them requires (2*sliceVerts).
            // Create the entire sphere as one single tri-strip array. This first for() loop steps through each 'slice', and the for() loop it contains steps through each vertex in the current slice.
            // INITIALIZE:
            var cosBot = 0.0;					// cosine and sine of the lattitude angle for
            var sinBot = 0.0;					// 	the current slice's BOTTOM (southward) edge. 
            // (NOTE: Lattitude = 0 @equator; -90deg @south pole; +90deg at north pole)
            var cosTop = 0.0;					// "	" " for current slice's TOP (northward) edge
            var sinTop = 0.0;
            // for() loop's s var counts slices; 
            // 				  its v var counts vertices; 
            // 					its j var counts Float32Array elements 
            //					(vertices * elements per vertex)	
            var j = 0;							// initialize our array index
            var isFirstSlice = 1;		// ==1 ONLY while making south-pole slice; 0 otherwise
            var isLastSlice = 0;		// ==1 ONLY while making north-pole slice; 0 otherwise
            for(s=0; s<slices; s++) {	// for each slice of the sphere,---------------------
                // For current slice's top & bottom edges, find lattitude angle sin,cos:
                if(s==0) {
                    isFirstSlice = 1;		// true ONLY when we're creating the south-pole slice
                    cosBot =  0.0; 			// initialize: first slice's lower edge is south pole.
                    sinBot = -1.0;			// (cos(lat) sets slice diameter; sin(lat) sets z )
                }
                else {					// otherwise, set new bottom edge == old top edge
                    isFirstSlice = 0;	
                    cosBot = cosTop;
                    sinBot = sinTop;
                }								// then compute sine,cosine of lattitude of new top edge.
                cosTop = Math.cos((-Math.PI/2) +(s+1)*sliceAngle); 
                sinTop = Math.sin((-Math.PI/2) +(s+1)*sliceAngle);
                // (NOTE: Lattitude = 0 @equator; -90deg @south pole; +90deg at north pole)
                // (       use cos(lat) to set slice radius, sin(lat) to set slice z coord)
                // Go around entire slice; start at x axis, proceed in CCW direction 
                // (as seen from origin inside the sphere), generating TRIANGLE_STRIP verts.
                // The vertex-counter 'v' starts at 0 at the start of each slice, but:
                // --the first slice (the South-pole end-cap) begins with v=1, because
                // 		its first vertex is on the TOP (northwards) side of the tri-strip
                // 		to ensure correct winding order (tri-strip's first triangle is CCW
                //		when seen from the outside of the sphere).
                // --the last slice (the North-pole end-cap) ends early (by one vertex)
                //		because its last vertex is on the BOTTOM (southwards) side of slice.
                //
                if(s==slices-1) isLastSlice=1;// (flag: skip last vertex of the last slice).
                for(v=isFirstSlice;    v< 2*sliceVerts-isLastSlice;   v++,j+=floatsPerVertex)
                {						// for each vertex of this slice,
                    if(v%2 ==0) { // put vertices with even-numbered v at slice's bottom edge;
                                                // by circling CCW along longitude (east-west) angle 'theta':
                                                // (0 <= theta < 360deg, increases 'eastward' on sphere).
                                                // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
                                                // where			theta = 2*PI*(v/2)/capVerts = PI*v/capVerts
                        sphVerts[j  ] = r*(cosBot * Math.cos(Math.PI * v/sliceVerts)) + center[0];	// x
                        sphVerts[j+1] = r*(cosBot * Math.sin(Math.PI * v/sliceVerts)) + center[1];	// y
                        sphVerts[j+2] = r*(sinBot)+center[2];																			// z
                        sphVerts[j+3] = 1.0;																				// w.				
                    }
                    else {	// put vertices with odd-numbered v at the the slice's top edge
                                    // (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
                                    // and thus we can simplify cos(2*PI* ((v-1)/2)*sliceVerts)
                                    // (why (v-1)? because we want longitude angle 0 for vertex 1).  
                        sphVerts[j  ] = r*(cosTop * Math.cos(Math.PI * (v-1)/sliceVerts))+center[0]; 	// x
                        sphVerts[j+1] = r*(cosTop * Math.sin(Math.PI * (v-1)/sliceVerts))+center[1];	// y
                        sphVerts[j+2] = r*(sinTop)+center[2];		// z
                        sphVerts[j+3] = 1.0;	
                    }
                    sphVerts[j+4]=errColr[0]; 
                    sphVerts[j+5]=errColr[1]; 
                    sphVerts[j+6]=errColr[2];				
                }
            }
            return sphVerts;
        }

        function makeCylinder(r, center, h, colorVec) {
            //==============================================================================
            // Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
            // 'stepped spiral' design (Method 2) described in the class lecture notes.
            // Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
            //
            
            
             var errColr = new Float32Array(colorVec);	// Bright-red trouble color.
            
             var capVerts = 50;	// # of vertices around the topmost 'cap' of the shape
             var topRadius = r;		// radius of top of cylinder (bottom is always 1.0)
             var floatsPerVertex = 7;
             // Create a (global) array to hold all of this cylinder's vertices;
             var cylVerts = new Float32Array(  ((capVerts*6) -2) * floatsPerVertex);
             // # of vertices * # of elements needed to store them. How many vertices?
                                                    // Cylinder bottom end-cap:   (2*capVerts) -1  vertices;
                                                     // (includes blue transition-edge that links end-cap & wall);
                                                     // + Cylinder wall requires   (2*capVerts) vertices;
                                                     // + Cylinder top end-cap:    (2*capVerts) -1 vertices
                                                     // (includes green transition-edge that links wall & endcap).
            
                // Create circle-shaped bottom cap of cylinder at z=-1.0, radius 1.0,
                // with (capVerts*2)-1 vertices, BUT STOP before you create it's last vertex.
                // That last vertex forms the 'transition' edge from the bottom cap to the 
                // wall (shown in blue in lecture notes), & we make it in the next for() loop.
                // 
                // v counts vertices: j counts array elements (vertices * elements per vertex)
                for(v=0,j=0;   v<(2*capVerts)-1;   v++,j+=floatsPerVertex) {	
                    // START at vertex v = 0; on x-axis on end-cap's outer edge, at xyz = 1,0,-1.
                    // END at the vertex 2*(capVerts-1), the last outer-edge vertex before 
                    // we reach the starting vertex at 1,0,-1. 
                    if(v%2 ==0)
                    {				// put even# vertices around bottom cap's outer edge,starting at v=0.
                                    // visit each outer-edge location only once; don't return to 
                                    // to the location of the v=0 vertex (at 1,0,-1).
                                    // x,y,z,w == cos(theta),sin(theta),-1.0, 1.0, 
                                    // 		where	theta = 2*PI*((v/2)/capVerts) = PI*v/capVerts
                        cylVerts[j  ] = r*Math.cos(Math.PI*v/capVerts)+center[0];			// x
                        cylVerts[j+1] = r*Math.sin(Math.PI*v/capVerts)+center[1];			// y
                        //	(Why not 2*PI? because 0 < =v < 2*capVerts,
                        //	 so we can simplify cos(2*PI * (v/(2*capVerts))
                        cylVerts[j+2] =center[2];	// z
                        cylVerts[j+3] = 1.0;	// w.
                        // r,g,b = botColr[] 
                        cylVerts[j+4]=errColr[0]; 
                        cylVerts[j+5]=errColr[1]; 
                        cylVerts[j+6]=errColr[2];
                    }
                    else {	// put odd# vertices at center of cylinder's bottom cap:
                        cylVerts[j  ] = center[0]; 			// x,y,z,w == 0,0,-1,1; centered on z axis at -1.
                        cylVerts[j+1] = center[1];	
                        cylVerts[j+2] =center[2]; 
                        cylVerts[j+3] = 1.0;			// r,g,b = ctrColr[]
                        cylVerts[j+4]=errColr[0]; 
                        cylVerts[j+5]=errColr[1]; 
                        cylVerts[j+6]=errColr[2];
                    }
                }
                // Create the cylinder side walls, made of 2*capVerts vertices.
                // v counts vertices within the wall; j continues to count array elements
                // START with the vertex at 1,0,-1 (completes the cylinder's bottom cap;
                // completes the 'transition edge' drawn in blue in lecture notes).
                for(v=0; v< 2*capVerts;   v++, j+=floatsPerVertex) {
                    if(v%2==0)	// count verts from zero again, 
                                            // and put all even# verts along outer edge of bottom cap:
                    {		
                            cylVerts[j  ] = r*Math.cos(Math.PI*(v)/capVerts)+center[0];		// x
                            cylVerts[j+1] = r*Math.sin(Math.PI*(v)/capVerts)+center[1];		// y
                            cylVerts[j+2] =center[2];	// ==z  BOTTOM cap,
                            cylVerts[j+3] = 1.0;	// w.
                            // r,g,b = walColr[]				
                            cylVerts[j+4]=errColr[0]; 
                            cylVerts[j+5]=errColr[1]; 
                            cylVerts[j+6]=errColr[2];			
                        if(v==0) {		// UGLY TROUBLESOME vertex--shares its 1 color with THREE
                                                    // triangles; 1 in cap, 1 in step, 1 in wall.
                                cylVerts[j+4] = errColr[0]; 
                                cylVerts[j+5] = errColr[1];
                                cylVerts[j+6] = errColr[2];		// (make it red; see lecture notes)
                            }
                    }
                    else		// position all odd# vertices along the top cap (not yet created)
                    {
                            cylVerts[j  ] = r * Math.cos(Math.PI*(v-1)/capVerts) + center[0];		// x
                            cylVerts[j+1] = r * Math.sin(Math.PI*(v-1)/capVerts) + center[1];		// y
                            cylVerts[j+2] = center[2] + h;	// == z TOP cap,
                            cylVerts[j+3] = 1.0;	// w.
                            // r,g,b = walColr;
                            cylVerts[j+4]=errColr[0]; 
                            cylVerts[j+5]=errColr[1]; 
                            cylVerts[j+6]=errColr[2];			
                    }
                }
                // Complete the cylinder with its top cap, made of 2*capVerts -1 vertices.
                // v counts the vertices in the cap; j continues to count array elements.
                for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
                    // count vertices from zero again, and
                    if(v%2==0) {	// position even #'d vertices around top cap's outer edge.
                        cylVerts[j  ] = r * Math.cos(Math.PI*(v)/capVerts) + center[0];		// x
                        cylVerts[j+1] = r * Math.sin(Math.PI*(v)/capVerts) + center[1];		// y
                        cylVerts[j+2] = center[2]+h;	// z
                        cylVerts[j+3] = 1.0;	// w.
                        // r,g,b = topColr[]
                        cylVerts[j+4]=errColr[0]; 
                        cylVerts[j+5]=errColr[1]; 
                        cylVerts[j+6]=errColr[2];
                        if(v==0) {	// UGLY TROUBLESOME vertex--shares its 1 color with THREE
                                                    // triangles; 1 in cap, 1 in step, 1 in wall.
                                cylVerts[j+4] = errColr[0]; 
                                cylVerts[j+5] = errColr[1];
                                cylVerts[j+6] = errColr[2];		// (make it red; see lecture notes)
                        }		
                    }
                    else {				// position odd#'d vertices at center of the top cap:
                        cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1
                        cylVerts[j+1] = 0.0;	
                        cylVerts[j+2] = center[2]+h; 
                        cylVerts[j+3] = 1.0;			
                        // r,g,b = topColr[]
                        cylVerts[j+4]=errColr[0]; 
                        cylVerts[j+5]=errColr[1]; 
                        cylVerts[j+6]=errColr[2];
                    }
                }
                return cylVerts;
            }