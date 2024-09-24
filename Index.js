const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//Screen is located at (0, 0, 0)


const Light = { // put the light above the origin
    x: 0,
    y: 50,
    z: 0,
}

const Eye = { // put the eye (of the beholder) in the middle of the screen, a distance back from the screen
    x: 0,
    y: 0,
    z: -2000,
}

const Wall = 0; // xLoc of the wall, assuming infinite height and depth

const Wall2 = canvas.width; // for simplicity, we can assume the walls are infinite, then find how far a beam, will have to travel to hit on of the walls


class Ray{ //  a ray will have two vector variables, origin and direction
    
    constructor(x,y){ // makes a ray based on the x,y coordinates of the screen

        this.origin = [x,y,0]; // origin marks where on the screen the ray is starting from (i.e which pixel it is starting from)
        this.direction = normalize([x,y,-Eye.z]); // direction is the normal vector of the viewers eye to the array of the screen
        this.hit = false;
        this.distance = Infinity;
        this.intensity = 0;
    }
}

const sphere1 = { // make a test sphere
    center: [-500,-50,30], // everything will be in front of the screen, therfore z should always be positive
    radius: 100
}

const sphere2 = {
    center: [500,50,10],
    radius: 100
}

const sphere3 = {
    center: [0,0,7],
    radius: 100
}

const spheres = [sphere1, sphere2, sphere3];

function rayCast(ray){

    let minT = Infinity;
    

    for(let i = 0;i < spheres.length;i++){
        let t = Infinity; // cast a ray t distance away from the screen

        let sphere = spheres[i];

        let disp = sub(ray.origin, sphere.center);

        let a = dot(ray.direction, ray.direction); // solving for the distance of the ray upon interesecting with the sphere we get the values of a , b, and c
        let b = 2 * dot(ray.direction, disp);
        let c = dot(disp, disp) - sphere.radius*sphere.radius;
        let discriminant = b*b - 4*a*c; 

        if(discriminant > 0){

        let t1 = (-b - Math.sqrt(discriminant)) / (2*a);
        let t2 = (-b + Math.sqrt(discriminant)) / (2*a);

            if(t1 > 0 && t1 < t){
                t = t1;
            } else if(t2 > 0 && t2 < t){
                t = t2;
            }

            if (t < minT){
                minT = t;
            }
        }
    }

    if (minT != Infinity){
        ray.hit = true;
    }
    
    ray.distance = minT; // intensity of illumination is intesity of light / (distance of camera to object)^2
    return ray;

}

function Luminence(point){ // returns the direct light of the ray
    return Math.sqrt((Light.x + point[0])**2 + (Light.y + point[1]) **2 + (Light.z + point[2]) ** 2);

}

function obstructed(ray){

}



//----------------------------------
//Vector methods
function dot(a,b){
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
}

function scale(a, b){
    return [a[0]*b, a[1]*b, a[2]*b];
}

function normalize(a){
    let len = magnitude(a);
    return [a[0]/len, a[1]/len, a[2]/len];
}

function magnitude(a){
    return Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]);
}

function add(a,b){
    return [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
}

function sub(a,b){
    return [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
}


//----------------------------------
// Render the sphere into space

function render(){
    let renderSize = 1; // adjust pixels generated per pixel for speed

    for(let x = 0; x < canvas.width; x+= renderSize){
        for(let y = 0; y < canvas.height; y+= renderSize){

            let ray = new Ray(x-canvas.width/2, y-canvas.height/2); // make a ray at each pixel, and make sure the graph gets translated to halfwaay on the screen
            rayCast(ray); // cast the ray

            if(ray.hit){
                ctx.fillStyle = rgb(255,ray.distance,ray.distance);
                
            }
                
            else if(ray.direction[1] > 0){
                ctx.fillStyle = 'purple';
            }
            
            else{
                ctx.fillStyle = rgb(0,0,0);
            }
            

            ctx.fillRect(x,y,1,1);
        }
    }
}

function wallIntersection(ray, wall){ // returns the distance of the ray for when it hits the wall
    return Math.abs(wall - ray.origin[0]/ray.direction[0]);
}


function rgb(r,g,b){
    return `rgb(${r},${g},${b})`;
}

render();



