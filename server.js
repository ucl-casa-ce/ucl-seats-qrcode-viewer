var express = require('express');
var app = express();
var QRCode = require('qrcode');
const request = require('request');

const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');
const isBetween = require('dayjs/plugin/isBetween')

dayjs.extend(isBetween)
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

// Check if environment variables are set
if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_SHEETS_KEY) {
    //Check if .env file exists
    require('dotenv').config()
    if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_SHEETS_KEY) {
        console.log('Using .env file');
    }else{
        console.log('Error: Specify GOOGLE_API_KEY and GOOGLE_SHEETS_KEY in environment file or in Docker Environment Variables');
        process.exit(1);
    }
}else{
    console.log('Using Docker Environment Variables');
}

const appKey = process.env.GOOGLE_API_KEY;
const sheetKey = process.env.GOOGLE_SHEETS_KEY;

const sheets_url = "https://sheets.googleapis.com/v4/spreadsheets/"+sheetKey+"/values/CE?alt=json&key="+appKey;
console.log("Using Sheets URL: " + sheets_url);

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

app.get('/schedule', function(req, res) {
    
    let options = {json: true};
    request(sheets_url, options, (error, res_req, body) => {
        if (error) {
            res.send('');
            return  console.log(error)
        };

        if (!error && res_req.statusCode === 200) {
            // do something with JSON, using the 'body' variable
            var schedule = body.values;

            // Check if the Spreadsheet is empty
            if(schedule == undefined){
                res.send("");
                return(0);
            }

            // Remove first element of array which are the headers in the spreadsheet
            schedule.shift();

            // Calculate the times needed to calculate the session needed to be displayed
            var nowDT = new dayjs();
            var minsBefore = nowDT.subtract(20, 'minute');
            var minsAfter = nowDT.add(20, 'minute');
                       
            var validSessions = [];
            var lastIndex = 0;
            var nextIndex = 0;

            //Loop through each element and convert first value of each array to date objects
            schedule.forEach(function(element) {
                var i = (schedule.indexOf(element));
                element.unshift(dayjs(element[0], "DD-MM-YYYY HH:mm:ss"));
                
                if(element[0].isBetween(minsBefore, minsAfter, "minute", "[]")){
                    validSessions.push(element);
                    lastIndex = i;
                }
                
                if(element[0].isSameOrBefore(nowDT)){
                    nextIndex = i;
                }

                //console.log(element[0].format("DD-MM-YYYY HH:mm:ss"));
            });
                       
            if(lastIndex == 0 && nextIndex > lastIndex){
                lastIndex = nextIndex - 1;
            }

            //console.log();
            //console.table(schedule);
            //console.table(validSessions);

            if(validSessions.length != 0){
                var nextSession = "";

                if(schedule.length >= lastIndex){
                    if(schedule[lastIndex+1] != undefined){
                        nextSession = schedule[lastIndex+1][2] + " @ " + schedule[lastIndex+1][0].format("DD-MM-YYYY HH:mm:ss");
                    }else{
                        nextSession = "No more classes in database";
                    }
                }else{
                    nextSession = "No more classes in database";
                }

                var display_class_code = parseInt(validSessions[0][3]);

                if (isNaN(display_class_code)) {
                    display_class_code = 0;
                }

                if(display_class_code.toString().length < 6){
                    display_class_code = display_class_code.toString().padStart(6, '0');
                }

                QRCode.toDataURL(display_class_code.toString(), qr_opts, function (err, url) {
                    res.render('./pages/session.ejs', {
                        year: data.year,
                        course: " - " + validSessions[0][2].replace("-"," ") + " - " + schedule[lastIndex][0].format("DD/MM/YYYY HH:mm"),
                        class_code: display_class_code.toString(),
                        qrcode: url,
                        server_time: nowDT.format("DD-MM-YYYY HH:mm:ss"),
                        next_session: nextSession,
                    });
                });
            }else{
                if(schedule.length >= nextIndex){
                    if(schedule[nextIndex+1] != undefined){
                        var nextSession = schedule[nextIndex+1][2] + " @ " + schedule[nextIndex+1][0].format("DD-MM-YYYY HH:mm:ss");
                    }else{
                        var nextSession = "No more classes in database";
                    }
                }else{
                    var nextSession = "No more classes in database";
                }

                res.render('./pages/session.ejs', {
                    year: data.year,
                    course: "",
                    class_code: "No Current Class",
                    qrcode: "/img/qr-icon.png",
                    server_time: nowDT.format("DD-MM-YYYY HH:mm:ss"),
                    next_session: nextSession
                });
            }
        }else{
            console.log();
            console.log("Error: " + res_req.statusCode + " - Sheets API Error");
            res.send('');
        };
    });
    
    
});

app.get('/:course/:class_code', function(req, res){

    var display_class_code = parseInt(req.params.class_code);

    if (isNaN(display_class_code)) {
        display_class_code = 0;
    }

    if(display_class_code.toString().length < 6){
        display_class_code = display_class_code.toString().padStart(6, '0');
    }

    QRCode.toDataURL(req.params.class_code, qr_opts, function (err, url) {
        res.render('./pages/index.ejs', {
            year: data.year,
            course: " - " + req.params.course.replace("-"," ").toUpperCase(),
            class_code: display_class_code,
            qrcode: url
        });
    });
});

app.get('/:class_code', function(req, res){

    var display_class_code = parseInt(req.params.class_code);

    if (isNaN(display_class_code)) {
        display_class_code = 0;
    }

    if(display_class_code.toString().length < 6){
        display_class_code = display_class_code.toString().padStart(6, '0');
    }

    QRCode.toDataURL(req.params.class_code, qr_opts, function (err, url) {
        res.render('./pages/index.ejs', {
            year: data.year,
            course: "",
            class_code: display_class_code,
            qrcode: url
        });
    });
});

app.get('/health', function(req, res) {
    res.send('1');
});

app.listen(8080);
console.log('Server is listening on port 8080');