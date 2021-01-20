function get_content(directory) {		
	return $.ajax({
		type : 'GET',
		url : directory,
	});
}

function create_new_div(class_name, id, id_root, style, text="") {
	if (null == document.getElementById(id)) {
		var div = document.createElement("div");
		div.className = class_name;
		div.id = id;
		div.style = style;
		div.innerHTML = text;
		document.getElementById(id_root).appendChild(div);
	}
}

function create_new_div_collapse(class_name, id, id_root, id_card_header, id_accordion) {
	if (null == document.getElementById(id)) {
		var div = document.createElement("div");
		div.className = class_name;
		div.id = id;
		div.setAttribute("aria-labelledby", id_card_header);
		div.setAttribute("data-parent", "#" + id_accordion);
		document.getElementById(id_root).appendChild(div);
	}
}

function create_new_btn(class_name, id, id_root, id_collapse, name, style) {
	if (null == document.getElementById(id)) {
		var btn = document.createElement("button");
		btn.className = class_name;
		btn.id = id;
		btn.type = "button"
		btn.innerHTML = name;
		btn.style = style;
		btn.setAttribute("data-toggle", "collapse");
		btn.setAttribute("data-target", "#" + id_collapse);
		btn.setAttribute("aria-expanded", false);
		btn.setAttribute("aria-controls", id_collapse);
		document.getElementById(id_root).appendChild(btn);
	}
}

function create_new_audio_record(id, id_root, source, type, preload = 'meta') {
	if (null == document.getElementById(id)) {
		var sound = document.createElement("audio");
		sound.id       = id;
		sound.controls = 'controls';
		sound.src      = source;
		sound.type     = 'audio/' + type;
		sound.preload  = preload;
		document.getElementById(id_root).appendChild(sound);
	}
}

function create_new_audio_stream(class_name, id, id_root, source, type, style, preload = 'auto') {
	if (null == document.getElementById(id)) {
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
}

function create_recording_day(year, month, day, id_card_body) {

	const query = '?x_auth_token=' + sessionStorage.getItem('x_auth_token');
	
	const date = year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
	const link_month = '/recordings/' + year + '/' + String(month).padStart(2, '0') + '/';
	const link_day = link_month + date;
	$.when(get_content(link_month + query)).done(function(data_month){

		const id_day = "day_" + date;
		
		$(data_month).find('a[href$="' + date + '.mp3"]').each(function() {
			create_new_div("row mb-3", id_day, id_card_body, "background-color:#dfdef6;", date);
			const id_record = "record_" + date;
			create_new_div("col-sm-2 themed-grid-col", id_record, id_day, "background-color:#dfdef6;");
			const id_audio = "audio_" + date;
			create_new_audio_record(id_audio, id_record, link_day + '.mp3' + query, 'mp3');
		});
		$(data_month).find('a[href$="' + date + '.ogg"]').each(function() {
			create_new_div("row mb-3", id_day, id_card_body, "background-color:#dfdef6;", date);
			const id_record = "record_" + date;
			create_new_div("col-sm-2 themed-grid-col", id_record, id_day, "background-color:#dfdef6;");
			const id_audio = "audio_" + date;
			create_new_audio_record(id_audio, id_record, link_day + '.ogg' + query, 'ogg');
		});
				
		const file_song = date + "_songs.html";
		$(data_month).find('a[href$="' + file_song + '"]').each(function() {
			$.when(get_content(link_month + file_song + query)).done(function(text){
				create_new_div("row mb-3", id_day, id_card_body, "background-color:#dfdef6;", date);
				const id_songs = "songs_" + date;
				create_new_div("col-sm-3 themed-grid-col", id_songs, id_day, "background-color:#dfdef6;");
				
				document.getElementById(id_songs).innerHTML = text;
			});
		});
		
		const file_news = date + "_news.html";
		$(data_month).find('a[href$="' + file_news + '"]').each(function() {
			$.when(get_content(link_month + file_news + query)).done(function(text){
				create_new_div("row mb-3", id_day, id_card_body, "background-color:#dfdef6;", date);
				const id_news = "news_" + date;
				create_new_div("col-sm-4 themed-grid-col", id_news, id_day, "background-color:#dfdef6;");
		
				document.getElementById(id_news).innerHTML = text;
			});
		});

	});		
}
			
function create_recordings() {
	const id_accordion = "accordion_idx";
	create_new_div("accordion", id_accordion, "id_replay", "background-color:#dfdef6;");
	
	const id_card = "card_idx";
	create_new_div("card", id_card, id_accordion, "background-color:#dfdef6;");
	
	const id_card_header = "card_header_idx";
	create_new_div("card-header", id_card_header, id_card, "background-color:#f6f6f6;");
	
	const id_btn = "btn_idx";
	const id_collapse = "collapse_idx";
	const btn_name = 'Aufnahmen';
	create_new_btn("btn btn-block text-left", id_btn, id_card_header, id_collapse, btn_name, "color:#000000");
	create_new_div_collapse("collapse", id_collapse, id_card, id_card_header, id_accordion);
	
	const id_card_body = "card_body_idx";
	create_new_div("card-header", id_card_body, id_collapse, "background-color:#dfdef6;");

	const date =  new Date();
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var day = date.getDate();
	
	for (i = 0; i < 20; i++) {
		create_recording_day(year, month, day, id_card_body);
		
		res = decrement_date(year, month, day);
		year = res[0];
		month = res[1];
		day = res[2];
	}
}

function decrement_date(year, month, day) {
	const days_in_month = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	
	--day;
	
	if (0 == day) {
		--month;
		
		if (0 == month) {
			--year;
			month = 12;
		}
		
		day = days_in_month[month];
	}
	
	return [year, month, day];
}
