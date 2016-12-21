var PlayMusic = require('playmusic');
var pm = new PlayMusic();
var jsonfile = require('jsonfile')
var fs = require('fs');
var https = require('https');
var async = require("async");
var ffmpeg = require('fluent-ffmpeg');
var dataLoaded=false
var path=""
var save=true;
var convert=false;
var email=""
var password=""
var size=16;



document.addEventListener("DOMContentLoaded", function(event) {
    var file = app.getPath(appData)+'/data.json'
    jsonfile.readFile(file, function(err, obj) {
        if(!err){
        document.getElementById("formsync").style.display = "none";
        document.getElementById("loggedin").style.display = "flex";

        dataLoaded=true;
        path=obj.path
        convert=obj.convert;
        email=obj.email
        password=obj.password
        size=obj.size;
    }
    })
 });

 document.querySelector('#p1').addEventListener('mdl-componentupgraded', function() {
     this.MaterialProgress.setProgress(0);
 });


 var form = document.getElementById('formsync');
 if (form.attachEvent) {
     form.attachEvent("submit", processForm);
 } else {
     form.addEventListener("submit", processForm);
 }

 document.getElementById("syncButton").addEventListener("click", function(event) {
    if(dataLoaded){
        process();
    }else{
    document.getElementById('submitForm').click()
    }
});

document.getElementById("saved").addEventListener("click", function(event) {
    fs.unlink(app.getPath(appData)+'/data.json',function(err){
       if(err) return console.log(err);
       location.reload();
  });
});


function convertWav(trackin,trackout,callback){
    ffmpeg(trackin)
    .toFormat('wav')
    .on('error', function (err) {
        console.log('An error occurred: ' + err.message);
        callback();
    })
    .on('progress', function (progress) {
        console.log('Processing: ' + progress.targetSize + ' KB converted');
    })
    .on('end', function () {
        console.log('Processing finished !');
        fs.unlink(trackin)
        callback();
    })
    .save(trackout);
}

function process(){
    pm.init({email: email, password: password}, function(err) {
        if(err){
            document.getElementById("advance").innerHTML="Login error, see <a  target='_blank' href='https://github.com/BenjaminPoilve/LilPlay'>FAQ</a>"
            console.error(err);
            return false
        }

        if(save){
            var file = app.getPath(appData)+'/data.json'
            var obj = {path: path.path,
                       convert: convert,
                       email: email,
                       password: password,
                       path: path,
                       size: size,
                    }
            jsonfile.writeFile(file, obj, function (err) {
                console.error(err)
            })
        }
        pm.getFavorites(function(err, data) {
            document.getElementById("p1").style.display = "flex";
            usedsize=0;
            var numSong=data.track.length
            index=0;
            async.eachSeries(data.track, function (track, callback) {
                name= track.title+"-"+track.artist
                console.log(name);
                console.log(track.storeId);
                if (!fs.existsSync(path+"/"+name+".mp3") && !fs.existsSync(path+"/"+name+".wav")) {
                    var file = fs.createWriteStream("/tmp/"+name+".mp3");
                    pm.getStreamUrl(track.storeId,function(err,streamUrl){
                        console.log(streamUrl)
                        var request = https.get(streamUrl, function(response) {
                            response.pipe(file);
                            response.on('end', function() {
                                index+=1;
                                document.getElementById("advance").innerHTML=index+"/"+numSong
                                document.querySelector('#p1').MaterialProgress.setProgress(100*index/numSong);
                                if(convert ){
                                    convertWav("/tmp/"+name+".mp3",path+"/"+name+".wav",callback);
                                }else{
                                    fs.createReadStream("/tmp/"+name+".mp3").pipe(fs.createWriteStream(path+"/"+name+".mp3"));
                                    fs.unlink("/tmp/"+name+".mp3",function(err){
                                       if(err) return console.log(err);
                                       callback();
                                   });
                                }
                            });
                        });
                    });
                }else{
                    index+=1;
                    document.getElementById("advance").innerHTML=index+"/"+numSong
                    document.querySelector('#p1').MaterialProgress.setProgress(100*index/numSong);
                    if(convert && fs.existsSync(path+"/"+name+".mp3")){
                        convertWav(path+"/"+name+".mp3",path+"/"+name+".wav",callback);
                    }else{
                        callback();
                    }
                }
            }, function (err) {
                if (err) { throw err; }
                console.log(usedsize);
                document.getElementById("advance").innerHTML="Done"
                console.log('Well done :-)!');
            });

        });
    });

}

function getFilesizeInBytes(filename) {
 var stats = fs.statSync(filename)
 var fileSizeInBytes = stats["size"]
 return fileSizeInBytes
}

function processForm(e) {
    if (e.preventDefault) e.preventDefault();
    var formData = new FormData(e.target)
    path= formData.get('path').path;
    console.log(path);
    save= formData.get('save');
    convert= formData.get('convert');
    email= formData.get('email');
    password= formData.get('password');
    size= formData.get('size');
    process();
    return false
}
