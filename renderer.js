// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var PlayMusic = require('playmusic');
var pm = new PlayMusic();




pm.init({email: "benjamin.poilve@student.ecp.fr", password: "abqvgnauyrrclips"}, function(err) {
    if(err) console.error(err);
    // place code here
    pm.getFavorites(function(err, data) {
          console.log(data.track);
      });


    pm.getStreamUrl("Terfaotmtadcmgp2yeajcy4fxze", console.log);

})
