var user_timeline = 'http://api.twitter.com/1/statuses/user_timeline.json?callback=?'
  , screen_name
  , since_id = 1
  , youtube_api = 'https://gdata.youtube.com/feeds/api/videos/{id}?v=2&alt=jsonc&callback=?'
  , longurl_api = 'http://api.longurl.org/v2/expand?callback=?&format=json'
  , songs = $("#songs")
  , icon = $("<i>").addClass("icon-play-circle")
  , first_time = true;

$("#username").submit(function(){
  screen_name = $("#screen_name").val();
  if(screen_name){
    window.location.hash = screen_name;
    window.location.reload(1);
  }
  return false;
});

songs.bind("fetch", function(){
  $.getJSON(user_timeline, { screen_name: screen_name, since_id: since_id }, function(r){
    $.each(r, function(i, tweet){
      if(tweet.text.match(/^http/i)){
        $.getJSON(longurl_api, {url: tweet.text}, function(r){
          since_id = Math.max(since_id, tweet.id); // good enough
          songs.trigger("add", [r["long-url"]]);
        });
      }
    });
  });  
});

songs.bind("add", function(event, url){
  var id = extract_youtube_id(url);
  if(id && songs.find(tofu("li[rel='{id}']", {id: id})).length === 0){
    $.getJSON(tofu(youtube_api, { id: id }), function(r){
      var song = $("<li>").text(r.data.title).attr("rel", id);
      songs.append(song);
      if(first_time){
        songs.trigger("next");
        first_time = false;
      }
    });
  }
});

songs.bind("next", function(){
  var current_song = songs.find(".playing")
    , song_list = songs.find("li");

  if(song_list.length){
    if(current_song.length){
      if(current_song.is(":last-child")){
        song_list.first().trigger("play");
      }else{
        songs.trigger("fetch");
        current_song.next().trigger("play");
      }
    }else{
      song_list.first().trigger("play");
    }
  }
});

songs.on("play", "li", function(){
  songs.find(".playing").removeClass("playing");
  $(this).addClass("playing").prepend(icon);
  ytplayer.loadVideoById($(this).attr("rel"));
});

$(function(){
    swfobject.embedSWF("http://www.youtube.com/v/lQlIhraqL7o?enablejsapi=1&playerapiid=ytplayer&version=3",
       "ytapiplayer", "425", "356", "8", null, null, { allowScriptAccess: "always" }, { id: "myytplayer" });
    
    screen_name = location.hash.substr(1);
    if(screen_name){
      $("#bookmark").html($("<a>").addClass("btn btn-primary").text("Bookmark Link").attr("href", "#"+screen_name));
      $("#screen_name").val(screen_name);
    }
});

/****/
function onYouTubePlayerReady(playerId) {
  ytplayer = document.getElementById("myytplayer");
  ytplayer.addEventListener("onStateChange", "onytplayerStateChange");
  songs.trigger("fetch");
}

function onytplayerStateChange(state){
  if(state === 0){
    songs.trigger("next");
  }
}

function tofu(a,c){return a.replace(/{ *([^} ]+) *}/g,function(b,a){b=c;a.replace(/[^.]+/g,function(a){b=b[a]});return b})}

// http://stackoverflow.com/a/8260383
function extract_youtube_id(url){
  //url = 'asdasd http://youtu.be/NLqAF9hrVbYy lolcats';
  var match = unescape(url).match(/.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#\&\?]{10,12}).*/);
  return match ? match[1] : null;
}
