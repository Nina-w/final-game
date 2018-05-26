var circles = {};
var image = new Image();
var imageArray = ['/img/image1.jpg', 'img/image2.jpg', 'img/image3.jpg', 'img/image4.jpg', 'img/image5.jpg']
var imagePath = imageArray [parseInt(Math.random()*6)]
var canvas = document.querySelector('#art');
var contextArt = canvas.getContext('2d');
var circleDiv = document.querySelector('#circles');

function addImage() {
    image.src = imagePath;
    image.onload = getCircles;
}

function getCircles() {
    circles = {
        //512: circlizeImage(512)
        //, 256: circlizeImage(256)
        128: circlizeImage(128)
        , 64: circlizeImage(64)
        , 32: circlizeImage(32)
        , 16: circlizeImage(16)
        , 8: circlizeImage(8)
        , 4: circlizeImage(4)
        , 2: circlizeImage(2)
        , 1: circlizeImage(1)
    }
    addCirclesToBody();
    document.querySelector ('#art').style.display = 'none';
}

function circlizeImage(size) {
    canvas.width = size;
    canvas.height = size;
    contextArt.drawImage(image, 0, 0, size, size);
    imageData = contextArt.getImageData(0,0, size, size);
    var x = 0;
    var y = 0;
    var p = 0;
    var pixel = 0;
    var pixelSize = 512/size;
    var pixelCount = imageData.data.length / 4;
    var circles = {};
    while(pixel < pixelCount) {
        var red = imageData.data[p++];
        var green = imageData.data[p++];
        var blue = imageData.data[p++];
        var alpha = imageData.data[p++];
        y = pixel % size;
        x = Math.floor(pixel / size);
        var point = `${x},${y}`;
        circles[point] =  `<div point='${point}' class='circle s${size}' style='background-color:rgb(${red},${green},${blue}); top:${x*pixelSize + 100}px; left:${y*pixelSize + 300}px; display:none;'></div>`;
        pixel = p / 4;
    }
    return circles;
}

function addCirclesToBody() {
    var circleDivs = '';
    Object.keys(circles).forEach(function(size) {
        Object.keys(circles[size]).forEach(function(point) {
            circleDivs += circles[size][point]
        })
    });
    circleDiv.innerHTML = circleDivs;
    startArt();
}

function startArt() {
    showNextFour(1,'0,0')
}

function showNextFour(level, point) {
    var circle = document.querySelector(`.s${level}[point="${point}"]`);
    circle.style.display='block';
    if(circle.classList.contains('s128')) return;
    circle.addEventListener('mousemove', function(e) {
        var point = e.target.getAttribute('point').split(',');
        var parent = e.target.parentNode;
        if(!parent) return;
        parent.removeChild(e.target);
        var x = point[0]*2;
        var y = point[1]*2;
        level = level*2;
        showNextFour(level, `${x},${y}`)
        showNextFour(level, `${x + 1},${y}`)
        showNextFour(level, `${x},${y + 1}`)
        showNextFour(level, `${x + 1},${y + 1}`)

    })
}

addImage();
