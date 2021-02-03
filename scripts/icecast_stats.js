function get_content(directory) {        
    return $.ajax({
        type : 'GET',
        url : directory,
    });
}
        
function create_new_div(class_name, id, id_root, style, text="") {
    var div = document.createElement("div");
    div.className = class_name;
    div.id = id;
    div.style = style;
    div.innerHTML = text;
    document.getElementById(id_root).appendChild(div);
}

function create_new_audio_stream(class_name, id, id_root, source, type, style, preload = 'auto') {
    var sound = document.createElement("audio");
    sound.id       = id;
    sound.controls = 'controls';
    sound.src      = source;
    sound.type     = 'audio/' + type;
    sound.preload  = preload;
    sound.autoplay  = 'autoplay';
    sound.className = class_name;
    sound.style = style;

    const volume_level = localStorage.getItem('antentafm_volume');
    if (volume_level) {
        sound.volume = volume_level;
    } else {
        sound.volume = 0.5;
    }

    sound.onvolumechange = function() {
        localStorage.setItem('antentafm_volume', this.volume)
    };

    document.getElementById(id_root).appendChild(sound);
}
        
function update_icecast_stats() {
    $.when(get_content('https://stream.antentafm.ddnss.de/status-json.xsl')).done(function(json_data){
        var is_online = false;
        var content = 'Offline';

        // parse json config
        if ("icestats" in json_data) {
            if ("source" in json_data["icestats"]) {
				is_online = true;
				
                content = '';
                
                var is_song_filled = false;

                if ("title" in json_data["icestats"]["source"]) {
                    if (json_data["icestats"]["source"]["title"] != "") {
                        content = "Song: " + json_data["icestats"]["source"]["title"];
                        is_song_filled = true;
                    }
                }
                
                if (!is_song_filled && ("server_name" in json_data["icestats"]["source"])) {
                    content = "Song: " + json_data["icestats"]["source"]["server_name"];
                }
                
                if ("listeners" in json_data["icestats"]["source"] && "listener_peak" in json_data["icestats"]["source"]) {
                    content = content +  " | Zuhörer (max): " + json_data["icestats"]["source"]["listeners"] + " (" + json_data["icestats"]["source"]["listener_peak"] + ")";    
                }
            }
        }
        
        // update stats output fields
        document.getElementById("id_stream_status").innerHTML = content;           
        
        // add elements if stream wasn't online before
        if (true == is_online) {
            if (null == document.getElementById("id_live_stream")) {
                const query = '?x_auth_token=' + localStorage.getItem('antentafm_token');
                create_new_audio_stream('rounded-lg', 'id_live_stream', 'id_live', 'https://stream.antentafm.ddnss.de/cast' + query, 'mp3', 'background-color:#dfdef6;');
            }
        }
    });
}