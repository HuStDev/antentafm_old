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
	document.getElementById(id_root).appendChild(sound);
}
		
function update_icecast_stats() {
	$.when(get_content('https://stream.antentafm.ddnss.de/status-json.xsl')).done(function(json_data){
		var listeners = "";
		var online_state = "offline";
		var is_online = false;
		var title = "";
		
		// parse json config
		if ("icestats" in json_data) {
			if ("source" in json_data["icestats"]) {
				online_state = "online";
				is_online = true;
				
				if ("listeners" in json_data["icestats"]["source"] && "listener_peak" in json_data["icestats"]["source"]) {
					listeners = "Zuhörer (max): " + json_data["icestats"]["source"]["listeners"] + " (" + json_data["icestats"]["source"]["listener_peak"] + ")";	
				}
				
				if ("title" in json_data["icestats"]["source"]) {
					title = "Song: " + json_data["icestats"]["source"]["title"];
				}
			}
		}
		
		// update stats output fields
		document.getElementById("id_live_stats_online").innerHTML = "Status: " + online_state;
		document.getElementById("id_live_stats_song").innerHTML = title;
		document.getElementById("id_live_stats_listeners").innerHTML = listeners;			
		
		// add elements if stream wasn't online before
		if (true == is_online) {
			if (null == document.getElementById("id_live_stream")) {
				const query = '?x_auth_token=' + sessionStorage.getItem('x_auth_token');
				create_new_audio_stream('rounded-lg', 'id_live_stream', 'id_live', 'https://stream.antentafm.ddnss.de/cast' + query, 'mp3', 'background-color:#dfdef6;');
			}
			
			if (null == document.getElementById("id_live_stream_link")) {
				create_new_div("row mb-3", "id_live_stream_link", "id_live", "background-color:#dfdef6;", text='<a href="https://stream.antentafm.ddnss.de/cast" target="_blank">Direktlink</a> bei Problemen mit Audio-Element.');
			}
		}
	});
}