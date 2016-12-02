var colors = [];
var angleShift = 0;
var autoRotation = true;
var colorIndex = -1;
var totalCars = 0;
var brands = [
    "bmw",
    "toyota",
    "nissan"
];

var carsCount = [3, 4, 2];

CanvasRenderingContext2D.prototype.DrawSector = function (x, y, radiusA, radiusB, angleFrom, angleTo) {
    this.save();
    this.beginPath();
    this.translate(x, y);
    this.moveTo(0, 0);
    this.scale(radiusA / radiusB, 1);
    this.arc(0, 0, radiusB, angleFrom, angleTo, false);
    this.restore();
    this.closePath();
};

function FillData() {
    for (var i = 0; i < carsCount.length; ++i) {
        totalCars += carsCount[i];
        colors.push(GetRandomColor());
    }

    AddColors();
    requestAnimationFrame(DrawPieChart);
    requestAnimationFrame(IncreaseShift);
}

function GetRandomColor() {
    return '#' + Math.round((Math.random() * (999999 - 100000) + 100000));
}

function AddColors() {
    var length = colors.length;
    for (var i = 0; i < length; ++i) {
        colors.push(ColorLuminance(colors[i], -0.5));
    }
    for (var i = 0; i < length; ++i) {
        colors.push(ColorLuminance(colors[i], 0.5));
    }
    for (var i = 0; i < length; ++i) {
        colors.push(ColorLuminance(colors[i], 0.8));
    }
}

function ColorLuminance(hex, lum) {
    hex = String(hex).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
        hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    }

    lum = lum || 0;
    var rgb = "#", c, i;
    for (i = 0; i < 3; i++) {
        c = parseInt(hex.substr(i*2,2), 16);
        c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
        rgb += ("00"+c).substr(c.length);
    }

    return rgb;
}

function DrawPieChart() {
    HelpClear();
    var canvas = document.getElementById('pieChart');
    var context = canvas.getContext('2d');
    canvas.height = 300;
    canvas.width = 400;
    var initialAngle = angleShift;
    var centerX = Math.floor(canvas.width / 2);
    var centerY = Math.floor(canvas.height / 2);
    var radius = Math.floor((canvas.width - 200) / 2);

    for (var j = 0; j < 20; ++j) {
        for (var i = 0; i < brands.length; ++i) {
            var angle = carsCount[i] / totalCars * 360;
            var newAngle = initialAngle + angle;
            context.DrawSector(centerX, centerY, 160, radius, degreesToRadians(initialAngle), degreesToRadians(newAngle));
            context.strokeStyle = ColorLuminance(colors[i], -0.5);

            if (CheckColorInArray(i)) {
                context.strokeStyle = ColorLuminance(colors[i], 0.5);
            }

            context.lineWidth = 2;
            context.stroke();
            initialAngle += angle;
        }

        centerY -= 1;
    }

    initialAngle = angleShift;
    for (var i = 0; i < brands.length; ++i) {
        var angle = carsCount[i] / totalCars * 360;
        var newAngle = initialAngle + angle;

        context.DrawSector(centerX, centerY + 1, 160, radius, degreesToRadians(initialAngle), degreesToRadians(newAngle));
        context.fillStyle = colors[i];
        if (CheckColorInArray(i)) {
            context.fillStyle = ColorLuminance(colors[i], 0.8);
            ShowHelp(brands[i].toString() + '  :  ' + carsCount[i].toString(), ColorLuminance(colors[i], 0.8));
        }

        context.fill();
        initialAngle += angle;
    }

    requestAnimationFrame(DrawPieChart);
}

function CheckColorInArray(i) {
    while (i < colors.length) {
        if (i == colorIndex) {
            return true;
        }
        else {
            i += carsCount.length;
        }
    }

    return false;
}

function IncreaseShift() {
    if (autoRotation) {
        angleShift += 5;
    }

    requestAnimationFrame(IncreaseShift);
}

function degreesToRadians(degrees) {
    return (degrees * Math.PI)/180;
}

function ShowHelp(message, color) {
    var canvas = document.getElementById("help");
    canvas.height = 100;
    canvas.width = 300;
    var ctx = canvas.getContext("2d");

    ctx.rect(0,0, canvas.width, canvas.height);
    var gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(1/7, '#FF0000');
    gradient.addColorStop(2/7, '#FF7F00');
    gradient.addColorStop(3/7, '#FFFF00');
    gradient.addColorStop(4/7, '#00FF00');
    gradient.addColorStop(5/7, '#0000FF');
    gradient.addColorStop(6/7, '#4B0082');
    gradient.addColorStop(7/7, '#8F00FF');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowColor = "black";
    ctx.shadowBlur = 5.0;
    ctx.shadowOffsetX = 3.0;
    ctx.shadowOffsetY = 3.0;
    ctx.font = "italic 32pt Arial";
    ctx.fillText(message, 10, 50);
}

function HelpClear() {
    var canvas = document.getElementById("help");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function ToHEX(r, g, b) {
    return '#' + ((b | g << 8 | r << 16) | 1 << 24).toString(16).slice(1);
}

function CompareColor(color) {
    for (var i = 0; i < colors.length; ++i) {
        if (colors[i] == color) {
            return i;
        }
    }

    return -1;
}

function Update(xClick, yClick) {
    cursorPositionOnCanvas = { left: xClick, top: yClick };

    var canvas = document.getElementById('pieChart');
    var context = canvas.getContext('2d');

    var pixel = context.getImageData(cursorPositionOnCanvas.left, cursorPositionOnCanvas.top,
                                    cursorPositionOnCanvas.left, cursorPositionOnCanvas.top);
    var pixelColor = { r: pixel.data[0], g: pixel.data[1], b: pixel.data[2], a: pixel.data[3] };
    var color = ToHEX(pixelColor.r, pixelColor.g, pixelColor.b);
    colorIndex = CompareColor(color);
}

$(function() {
    $("#pieChart").mousemove(function(e) {
        var xClick = e.pageX - $(this).offset().left;
        var yClick = e.pageY - $(this).offset().top;

        Update(xClick, yClick);
    });
    $("#pieChart").mouseenter(function(e) {
        autoRotation = false;
    });
    $("#pieChart").mouseleave(function(e) {
        autoRotation = true;
        colorIndex = -1;
    });
})