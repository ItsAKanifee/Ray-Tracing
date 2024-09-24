const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;



//Screen is located at (0, 0, 0)


const lightPoint = { // put the light above the origin
    pos: [0, -canvas.height/2, 20],
    intensity: 0.6,
    type: 'point',
}

const ambLight = {
    intensity: 0.2,
    type: 'ambient',
}

const dirLight = {
    direction: [1, 5, -1],
    intensity: 0.8,
    type: 'directional',
}

const lights = [lightPoint, ambLight, dirLight];

const Eye = { // put the eye (of the beholder) in the middle of the screen, a distance back from the screen
    x: 0, // x is 0 and y is 0 at the center of the screen
    y: 0,
    z: -2000, // eye is 2000 pixels away from the screen
}

const Wall = 0; // xLoc of the wall, assuming infinite height and depth

const Wall2 = canvas.width; // for simplicity, we can assume the walls are infinite, then find how far a beam, will have to travel to hit on of the walls


class Ray{ //  a ray will have two vector variables, origin and direction
    
    constructor(x,y){ // makes a ray based on the x,y coordinates of the screen

        this.origin = [x,y,0]; // origin marks where on the screen the ray is starting from (i.e which pixel it is starting from)
        this.direction = normalize([x,y,-Eye.z]); // direction is the normal vector of the viewers eye to the array of the screen
        this.hit = false;
        this.distance = Infinity;
        this.color = 'black';
    }
}

const sphere1 = { // green sphere
    center: [-500,-50,300], // everything will be in front of the screen, therfore z should always be positive
    radius: 100,
    color : [0,255,0],
    specular: 500,
    reflect: 0,
}

const sphere2 = { // red sphere
    center: [300,-0,300], // focus on changing these from pixel values to percentage of the screen so that way this can be rendered on screens that are smaller than mine
    radius: 100,
    color : [255, 0, 0],
    specular: 500,
    reflect: 0.1,
}

const sphere3 = { // blue sphere
    center: [0,0,500],
    radius: 100,
    color : [0, 0, 255],
    specular: 1000,
    reflect: 0.5,
}

const spheres = [sphere1, sphere2, sphere3];

function sphereIntersect(origin, direction, sphere){
    t = Infinity;

    let disp = sub(origin, sphere.center);

    let a = dot(direction, direction); // solving for the distance of the ray upon interesecting with the sphere we get the values of a , b, and c
    let b = 2 * dot(direction, disp);
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
    }

    return t;
}

function shortestSphere(origin, direction){
    let minT = Infinity;
    let sphereActive = null;
    

    for(let i = 0; i < spheres.length;i++){
        let sphere = spheres[i];
        let t = sphereIntersect(origin, direction, sphere);

        if (t < minT){
            minT = t;
            sphereActive = sphere;
        }
    }

    return [minT, sphereActive];
}




function rayCast(ray){

    let [minT, sphereActive] = shortestSphere(ray.origin, ray.direction);

    if (minT != Infinity){
        ray.hit = true;

        var Point = add(ray.origin, scale(ray.direction, minT));
        var Normal = sub(Point, sphereActive.center);
        Normal = normalize(Normal);

        let D = scale(ray.direction, -1);


        let RGB = scale(sphereActive.color, Luminence(Point, Normal, D, sphereActive.specular));
        

        let r = sphereActive.reflect;

        if(r > 0){
            let DR = dot(D, Normal);
            let R = sub(scale(Normal, 2*DR), D);

            let reflected = reflect(Point, R, 5);

            console.log(reflected);

            let fHalf = scale(RGB, 1-r);
            let sHalf = scale(reflected, r);

            RGB = add(fHalf, sHalf);
        }
        
        ray.color = rgb(RGB[0], RGB[1], RGB[2]);
        
    }
    
    ray.distance = minT; // intensity of illumination is intesity of light / (distance of camera to object)^2
    return ray;

}


function reflect(point, direction, reflections){ // returns the reflected light of the ray
    let [minT, sphereActive] = shortestSphere(point, direction);

    if(sphereActive == null){
        return [0,0,0];
    }

    var Point = add(point, scale(direction, minT));
    var Normal = sub(Point, sphereActive.center);
    Normal = normalize(Normal);

    let D = scale(direction, -1);


    let RGB = scale(sphereActive.color, Luminence(Point, Normal, D, sphereActive.specular));

    let r = sphereActive.reflect;

    if(r <= 0 || reflections <= 0){
        return RGB;
    }

    let DR = dot(D, Normal);
    let R = sub(scale(Normal, 2*DR), D);

    let reflected = reflect(Point, R, reflections - 1);

    let fHalf = scale(RGB, 1-r);
    let sHalf = scale(reflected, r);

    return add(fHalf, sHalf);
    
}

function Luminence(point, normal, toCam, specular){ // returns the direct light of the ray
    var lumin = 0.0;
    for(let i = 0; i < lights.length; i++){
        let light = lights[i];

        if(light.type == 'ambient'){
            lumin += light.intensity;
        }else{
            let L = [0,0,0]; // direction of the light

            if(light.type == 'point'){
                L = sub(light.pos, point);
            }
            else{
                L = light.direction;
            }

            var nL = dot(normal, L);

            if(nL > 0){
                lumin += light.intensity * nL / (magnitude(normal)*magnitude(L));
            }

            // calculate the shadow

            let [shortestT, shadSphere] = shortestSphere(point, L);
            if(shadSphere != null){
                limun = 0;
            }

            // calcualte the specular (shinyness) of thee spheres

            if(specular != -1){      
                let R = sub(scale(normal, 2*nL), L); // 2 * N * dot(N, L) - L
                
                let rToCam = dot(R, toCam);

                if(rToCam > 0){
                    lumin += light.intensity * Math.pow(rToCam / (magnitude(R)*magnitude(toCam)), specular);
                }
            }
            
        }
    }

    return lumin;
}



//----------------------------------
//Vector methods
function dot(a,b){
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
}

function scale(a, b){ // a is vector, b is scale
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
                
            ctx.fillStyle = ray.color;
            

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



