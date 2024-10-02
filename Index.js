const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const pt = canvas.height / 100; // create a unit equivalent to 1% of the screen height
console.log(pt);

//Screen is located at (0, 0, 0)
const floorDepth = 52 * pt;
const LeftWallPos = -canvas.width / 2;
const RightWallPos = canvas.width / 2;
const backwallDepth = 260 * pt;
const ceilingHeight = -50 * pt;

const lightPoint = {
  // put the light above the origin
  pos: [0, -canvas.height / 2, 0],
  intensity: 0.6,
  type: "point",
};

const ambLight = {
  intensity: 0.2,
  type: "ambient",
};

const dirLight = {
  direction: [0, -pt, pt],
  intensity: 0.2,
  type: "directional",
};

const lights = [lightPoint, ambLight, dirLight];

const Eye = {
  // put the eye (of the beholder) in the middle of the screen, a distance back from the screen
  x: 0, // x is 0 and y is 0 at the center of the screen
  y: 0,
  z: -100 * pt, // eye is 2000 pixels away from the screen
};

class Ray {
  //  a ray will have two vector variables, origin and direction

  constructor(x, y) {
    // makes a ray based on the x,y coordinates of the screen

    this.origin = [x, y, 0]; // origin marks where on the screen the ray is starting from (i.e which pixel it is starting from)
    this.direction = normalize([x, y, -Eye.z]); // direction is the normal vector of the viewers eye to the array of the screen
    this.hit = false;
    this.distance = Infinity;
    this.color = "black";
  }
}

const sphere1 = {
  // green sphere
  center: [-66 * pt, 30 * pt, 52 * pt], // everything will be in front of the screen, therfore z should always be positive
  radius: 13 * pt,
  color: [0, 255, 0],
  specular: 1000,
  reflect: 0,
};

const sphere2 = {
  // red sphere
  center: [66 * pt, 20 * pt, 78 * pt], // focus on changing these from pixel values to percentage of the screen so that way this can be rendered on screens that are smaller than mine
  radius: 32 * pt,
  color: [255, 0, 0],
  specular: 300,
  reflect: 0.1,
};

const sphere3 = {
  // blue sphere
  center: [0, 0, 194 * pt],
  radius: 32 * pt,
  color: [0, 0, 255],
  specular: 200,
  reflect: 0.6,
};

const spheres = [sphere1, sphere2, sphere3];

//------------------------------------------
//Rendering Methods

function sphereIntersect(origin, direction, sphere) {
  t = Infinity;

  let disp = sub(origin, sphere.center);

  let a = dot(direction, direction); // solving for the distance of the ray upon interesecting with the sphere we get the values of a , b, and c
  let b = 2 * dot(direction, disp);
  let c = dot(disp, disp) - sphere.radius * sphere.radius;
  let discriminant = b * b - 4 * a * c;

  if (discriminant > 0) {
    // if discriminant is < 0, distance will be imginary, implying that the ray does not intersect with the sphere

    let t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
    let t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

    if (t1 > 0 && t1 < t) {
      t = t1;
    } else if (t2 > 0 && t2 < t) {
      t = t2;
    }
  }

  return t;
}

function shortestSphere(origin, direction) {
  // finds the sphere that is the shortest distance away from the origin
  let minT = Infinity;
  let sphereActive = null;

  for (let i = 0; i < spheres.length; i++) {
    let sphere = spheres[i];
    let t = sphereIntersect(origin, direction, sphere);

    if (t < minT) {
      minT = t;
      sphereActive = sphere;
    }
  }

  return [minT, sphereActive];
}

function rayCast(ray) {
  let [minT, sphereActive] = shortestSphere(ray.origin, ray.direction);

  if (minT != Infinity) {
    ray.hit = true;

    var Point = add(ray.origin, scale(ray.direction, minT));
    var Normal = sub(Point, sphereActive.center);
    Normal = normalize(Normal);

    let D = scale(ray.direction, -1); // make the direction from object to camera

    let RGB = scale(
      sphereActive.color,
      Luminence(Point, Normal, D, sphereActive.specular, sphereActive)
    ); // scale up the RGB with the luminosity of the point

    let r = sphereActive.reflect;

    if (r > 0) {
      let DR = dot(D, Normal);
      let R = sub(scale(Normal, 2 * DR), D);

      let reflected = reflect(Point, R, 10, sphereActive);

      let fHalf = scale(RGB, 1 - r);
      let sHalf = scale(reflected, r);

      RGB = add(fHalf, sHalf);
    }

    ray.color = rgb(RGB[0], RGB[1], RGB[2]);
  }

  ray.distance = minT; // intensity of illumination is intesity of light / (distance of camera to object)^2
  return ray;
}

function reflect(point, direction, reflections, sphere = null) {
  // returns the reflected light of the ray
  let [minT, sphereActive] = shortestSphere(point, direction);

  if (sphereActive == null || sphere == sphereActive) {
    return floorOrWall(point, direction);
  }

  var Point = add(point, scale(direction, minT));
  var Normal = sub(Point, sphereActive.center);
  Normal = normalize(Normal);

  let D = scale(direction, -1); // get the negative vector

  let RGB = scale(
    sphereActive.color,
    Luminence(Point, Normal, D, sphereActive.specular, sphereActive)
  );

  let r = sphereActive.reflect;

  if (r <= 0 || reflections <= 0) {
    return RGB;
  }

  let DR = dot(D, Normal);
  let R = sub(scale(Normal, 2 * DR), D);

  let reflected = reflect(Point, R, reflections - 1, sphereActive);

  let fHalf = scale(RGB, 1 - r);
  let sHalf = scale(reflected, r);

  return add(fHalf, sHalf);
}

function Luminence(point, normal, toCam, specular, sphere = null) {
  // returns the direct light of the ray
  var lumin = 0.0;
  for (let i = 0; i < lights.length; i++) {
    let light = lights[i];

    if (light.type == "ambient") {
      lumin += light.intensity;
    } else {
      let L = [0, 0, 0]; // direction of the light

      if (light.type == "point") {
        L = sub(light.pos, point);
      } else {
        L = light.direction;
      }

      // calculate the shadow

      let [shortestT, shadSphere] = shortestSphere(point, L);
      if (shadSphere != null && shadSphere != sphere) {
        continue;
      }

      //calculate the luminosity

      var nL = dot(normal, L);

      if (nL > 0) {
        lumin += (light.intensity * nL) / (magnitude(normal) * magnitude(L));
      }

      // calcualte the specular (shinyness) of thee spheres

      if (specular != -1) {
        let R = sub(scale(normal, 2 * nL), L); // 2 * N * dot(N, L) - L

        let rToCam = dot(R, toCam);

        if (rToCam > 0) {
          lumin +=
            light.intensity *
            Math.pow(rToCam / (magnitude(R) * magnitude(toCam)), specular);
        }
      }
    }
  }

  return lumin;
}

//----------------------------------
//Vector methods
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function scale(a, b) {
  // a is vector, b is scale
  return [a[0] * b, a[1] * b, a[2] * b];
}

function normalize(a) {
  let len = magnitude(a);
  return [a[0] / len, a[1] / len, a[2] / len];
}

function magnitude(a) {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
}

function add(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

//----------------------------------
// Render the sphere into space

function render() {
  let renderSize = 1; // adjust pixels generated per pixel for speed

  for (let x = 0; x < canvas.width; x += renderSize) {
    for (let y = 0; y < canvas.height; y += renderSize) {
      let ray = new Ray(x - canvas.width / 2, y - canvas.height / 2); // make a ray at each pixel, and make sure the graph gets translated to halfwaay on the screen
      rayCast(ray); // cast the ray

      if (!ray.hit) {
        let temp = floorOrWall(ray.origin, ray.direction);
        ray.color = rgb(temp[0], temp[1], temp[2]);
      }
      ctx.fillStyle = ray.color;

      ctx.fillRect(x, y, 1, 1);
    }
  }
}

//----------------------------------
// Wall operations

function floorOrWall(point, direciton) {
  // calculates the distance of the ray to each plane, and calulates which one is the shortest disitance
  let t = Infinity;
  let color = [0, 0, 0];
  let xDist1 = Infinity,
    xDist2 = Infinity;
  let norm = [0, 0, 0]; // set the normal as facing no direction

  if (direciton[0] != 0) {
    xDist1 = Math.abs((-canvas.width / 2 - point[0]) / direciton[0]); // using Dx + P = t, we can get the distance t of the screen to each wall/ floor
    xDist2 = Math.abs((canvas.width / 2 - point[0]) / direciton[0]);
  }

  let yDist = Math.abs((floorDepth - point[1]) / direciton[1]); // both of these directions cannot be 0 based on how the code works
  let yDist2 = Math.abs((ceilingHeight - point[1]) / direciton[1]);
  let zDist = Math.abs((backwallDepth - point[2]) / direciton[2]);

  color = [222, 11, 138];

  if (xDist1 < yDist && xDist1 < zDist && xDist1 < xDist2 && xDist1 < yDist2) {
    t = xDist1;
    //color = [50,160,95];
    norm = [1, 0, 0]; // the normal will face the opposite direction of the wall in respect to the center
  } else if (
    xDist2 < yDist &&
    xDist2 < zDist &&
    xDist2 < xDist1 &&
    xDist2 < yDist2
  ) {
    t = xDist2;
    //color = [50,160,95];
    norm = [-1, 0, 0];
  } else if (yDist < zDist && yDist < yDist2) {
    // wants to render floor
    t = yDist;
    //color = [60, 195, 100];
    norm = [0, -1, 0];
  } else if (yDist2 < zDist) {
    // wants to render ceiling
    t = yDist2;
    //color = [60, 195, 100];
    norm = [0, 1, 0];
  } else {
    t = zDist;
    //color = [100, 200, 150];
    norm = [0, 0, 1];
  }
  let D = scale(direciton, -1);
  color = scale(color, Luminence(point, norm, D, 1000));
  return color;
}

function rgb(r, g, b) {
  return `rgb(${r},${g},${b})`;
}

render();
