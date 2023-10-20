var express = require('express');
var app = express();
var QRCode = require('qrcode')

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

var data ={
    year: new Date().getFullYear(),
}

var qr_opts = {
    errorCorrectionLevel: 'H',
    type: 'image/jpeg',
    quality: 1,
    margin: 1,
    width: 500,
    //color: {
    //  dark:"#010599FF",
    //  light:"#FFBF60FF"
    //}
  }
  

app.get('/', function(req, res) {
    res.render('./pages/index.ejs', {
        year: data.year,
        course: "",
        class_code: "Enter Seats Code",
        qrcode: "/img/qr-icon.png"
    });
});

app.get('/:course/:class_code', function(req, res){
    QRCode.toDataURL(req.params.class_code, qr_opts, function (err, url) {
        res.render('./pages/index.ejs', {
            year: data.year,
            course: " - " + req.params.course.replace("-"," "),
            class_code: req.params.class_code,
            qrcode: url
        });
    });
});

app.get('/:class_code', function(req, res){
    QRCode.toDataURL(req.params.class_code, qr_opts, function (err, url) {
        res.render('./pages/index.ejs', {
            year: data.year,
            course: "",
            class_code: req.params.class_code,
            qrcode: url
        });
    });
});

app.get('/health', function(req, res) {
    res.send('1');
});

function convertToTitleCase(str) {
    if (!str) {
        return ""
    }
    return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
  }

app.listen(8080);
console.log('Server is listening on port 8080');
