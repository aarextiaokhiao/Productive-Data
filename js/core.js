function get_default_player() {
	var default_player = {
		production: null,
		bits: 0,
		bytes: 0,
		upgrades: [0,0,0],
		files: {
			unlocked: false,
			percentage: 100
		},
		computers: {
			unlocked: false, 
			file_selected: null,
			servers_unlocked: false
		},
		transfer: {
			words: 0,
			words_gain_rate_peak: 0,
			automation: {},
			autobuyers_unlocked: 0
		},
		statistics: {
			playtime: 0,
			total_bits: 0,
			total_bytes: 0,
			total_upgrades: 0,
			bits_injected: 0,
			files_dissolved: 0,
			total_exp: 0,
			total_levelups: 0,
			times_transfer: 0,
			time_this_transfer: 0,
			fastest_transfer: 1/0,
			total_words: 0,
			words_injected: 0,
			total_sxp: 0,
			servers_made: 0
		},
		feats: {
			achieved: [],
			notifications: 0
		},
		options: {
			auto_save: true,
			offline_progress: true,
			tick_rate: 30,
			notation: "Scientific",
			theme: {
				color: 5,
				light: false,
				dark: false
			},
			locked_bits_production: false
		},
		version: "0.1.5.1",
		lastTick: new Date().getTime()
	}
	for (var id=1; id<9; id++) default_player.files[id] = {bits: 0, words: 0}
	for (var id=1; id<5; id++) default_player.computers[id] = {exp: 0, level: 0, sxp: 0, is_server: false}
	return default_player
}
var data = {
	normal_computers: 4,
	computer_strength: 0.125
}

function game_tick() {
	var diff = new Date().getTime() - game.lastTick
	game.lastTick += diff
	diff /= 1e3

	game.statistics.playtime += diff
	game.statistics.time_this_transfer += diff

	if (game.production && can_produce(game.production)) {
		if (game.production == "bits") {
			var add = Math.min(get_bit_production() * diff, get_bit_capacity() - game.bits)
			game.bits += add
			game.statistics.total_bits += add
			if (game.files.unlocked) for (var file=1; file<9; file++) if (is_autobuyer_on(file + 5)) if (game.files[file].bits + Math.ceil(Math.floor(game.bits) * game.files.percentage / 100) >= Math.floor(Math.max(game.files[file].bits, 1) * 1.5)) inject_data(file)
		} else if (game.production == "bytes") {
			var add = Math.min(get_byte_production() * diff, game.bits / 8)
			game.bits -= add * 8
			game.bytes += add
			game.statistics.total_bytes += add
		}
		if (!can_produce(game.production)) {
			if (is_autobuyer_on(2) && game.production == "bits") produce("bytes")
			else if (is_autobuyer_on(1) && game.production == "bytes") produce("bits")
			else produce(game.production)
		}
	}
	if (is_autobuyer_on(5)) if (game.bytes >= get_upgrade_cost(3)) buy_upgrade(3)
	if (is_autobuyer_on(3)) if (game.bytes >= get_upgrade_cost(1)) buy_upgrade(1)
	if (is_autobuyer_on(4)) if (game.bytes >= get_upgrade_cost(2)) buy_upgrade(2)

	var total = 0
	var transfer_requirement = 160
	if (game.computers.unlocked) for (var comp=1; comp<5; comp++) {
		if (game.computers[comp].is_server) transfer_requirement -= 40
		else total += game.computers[comp].level
	}
	if (total >= transfer_requirement) {
		var words_gain = get_words_gain()
		var words_gain_rate = words_gain / game.statistics.time_this_transfer * 60
		game.transfer.words_gain_rate_peak = Math.max(words_gain_rate, game.transfer.words_gain_rate_peak)
	}
	
	document.getElementById("bits").innerHTML = "<b>Bits</b>: " + format(game.bits) + " / " + format(get_bit_capacity())
	document.getElementById("bits_production").innerHTML = format(get_bit_production(), 1) + "/s"
	document.getElementById("bytes").innerHTML = "<b>Bytes</b>: " + format(game.bytes)
	document.getElementById("bytes_production").innerHTML = format(get_byte_production(), 1) + "/s"
	
	if (tab_name == "transfer") {
		if (total < transfer_requirement) document.getElementById("transfer").textContent = "You need " + (transfer_requirement - total) + " more levels to transfer."
		else if (game.statistics.times_transfer == 0) document.getElementById("transfer").textContent = "Reset the game and transfer for words!"
		else document.getElementById("transfer").innerHTML = "Transfer for " + format(words_gain) + " words.<br>" + format(words_gain_rate / 60, 1) + "/min<br>Peak: " + format(game.transfer.words_gain_rate_peak / 60, 1) + "/min"
	}
	if (tab_name == "statistics") {
		document.getElementById("playtime").textContent = format_time(game.statistics.playtime)
		document.getElementById("total_bits").textContent = format(game.statistics.total_bits)
		document.getElementById("total_bytes").textContent = format(game.statistics.total_bytes)
		if (game.statistics.times_transfer > 0) document.getElementById("time_this_transfer").textContent = format_time(game.statistics.time_this_transfer)
	}
}

var game_loop
var auto_save
function start_interval() {
	game_loop = setInterval(game_tick, 1000/game.options.tick_rate)
	auto_save = setInterval(function() {
		if (game.options.auto_save) save_game()
	}, 3e4)
}

function stop_interval() {
	clearInterval(game_loop)
	clearInterval(auto_save)
}

function init_game() {
	var filesDiv = document.getElementById("tab_unlocked_files")
	for (var file=1; file<9; file++) {
		var fileDiv = document.createElement("div")
		fileDiv.className = "upgrade"
		fileDiv.innerHTML = "<div class='upgrade_effect' id='file_" + file + "'></div>" +
			"<button class='upgrade_button' id='file_" + file + "_button' onclick='inject_data(" + file + ")'>Inject</button>" +
			"<button class='inject_button_secondary' id='inject_words_" + file + "' onclick='inject_words(" + file + ")'>Inject with words</button>"
		filesDiv.append(fileDiv)
	}
	
	var computersDiv = document.getElementById("computers")
	for (var comp=1; comp<5; comp++) {
		var computerDiv = document.createElement("div")
		computerDiv.className = "computer"
		computerDiv.innerHTML = "<div class='upgrade_effect' id='computer_" + comp + "'></div>" +
			"<button class='upgrade_button' id='computer_" + comp + "_button' onclick='primary_computer_dissolve(" + comp + ")'>Dissolve</button>" +
			"<button class='inject_button_secondary' id='computer_" + comp + "_button_secondary' onclick='dissolve_for_sxp(" + comp + ")'>Dissolve for SXP</button>"
		computersDiv.append(computerDiv)
	}
	
	var automationDiv = document.getElementById("automation")
	for (var autobuyer=1; autobuyer<18; autobuyer++) {
		var autobuyerDiv = document.createElement("div")
		autobuyerDiv.className = "upgrade"
		autobuyerDiv.id = "autobuyer_" + autobuyer
		autobuyerDiv.innerHTML = "<div class='upgrade_effect'>" + autobuyer_names[autobuyer] + " Autobuyer</div>" +
			"<button class='upgrade_button' id='autobuyer_" + autobuyer + "_toggle' onclick='toggle_autobuyer(" + autobuyer + ")'></button>"
		automationDiv.append(autobuyerDiv)
	}
	
	game = get_default_player()
	load_game()
	tab_name = "stuck"
	switch_tab("upgrades")
	start_interval()
}

//Formatting
function format(num, places) {
	if (num == Number.POSITIVE_INFINITY) return "&#x221e;"
	if (places == undefined) places = 0
	var exponent = Math.max(Math.floor(Math.log10(num)), 0)
	var mantissa
	if (exponent < 4) {
		places = Math.max(places - exponent, 0)
		mantissa = Math.floor(num * Math.pow(10, places)) / Math.pow(10, places)
		if (mantissa == Math.pow(10, exponent + 1)) {
			exponent++
			places = Math.max(places - 1, 0)
			mantissa = Math.pow(10, exponent)
		}
		if (exponent < 4) return mantissa.toFixed(places)
	}
	if (game.options.notation == "Logarithm") return "e" + Math.log10(num).toFixed(3)
	mantissa = num / Math.pow(10, exponent)
	if (mantissa >= 9.9995) {
		mantissa = 1
		exponent ++
	}
	if (game.options.notation == "Scientific") return mantissa.toFixed(3) + "e" + exponent
	var places = exponent % 3
	if (game.options.notation == "Engineering") return (mantissa * Math.pow(10, places)).toFixed(3 - places) + "e" + (exponent - places)
	else if (game.options.notation == "Standard") return (mantissa * Math.pow(10, places)).toFixed(3 - places) + get_aas_abbreviation(Math.floor(exponent / 3) - 1)
	else if (game.options.notation == "Letters") return (mantissa * Math.pow(10, places)).toFixed(3 - places) + get_letters_abbreviation(Math.floor(exponent / 3))
}

function get_aas_abbreviation(x) {
	if (x == 0) return "k"
	if (x == 1) return "M"
	if (x == 2) return "B"
	if (x == 100) return "Ce"
	if (x == 101) return "UCe"
	if (x < 0 || x > 101) return "?"
	const units = ["", "U", "D", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "N"]
	const tens = ["", "D", "Vg", "Tg", "Qg", "Qq", "Sg", "Su", "Og", "Ng"]
	return units[x % 10] + tens[Math.floor(x / 10)] 
}

function get_letters_abbreviation(x) {
	var letters = "abcdefghijklmnopqrstuvwxyz"
	var result = ""
	while (x > 0) {
		result += letters.slice((x - 1) % 26, (x - 1) % 26 + 1)
		x = Math.floor(x / 26 - 1)
	}
	return result
}

const timeframes={year:31556952,
	month:2629746,
	day:86400,
	hour:3600,
	minute:60,
	second:1}
function format_time(s) {
	if (s < 1) {
		if (s < 0.002) return '1 millisecond'
		return Math.floor(s*1000)+' milliseconds'
	} else if (s < 59.5) {
		if (s < 1.005) return '1 second'
		return s.toPrecision(2)+' seconds'
	} else if (s < Number.POSITIVE_INFINITY) {
		var timeFormat=''
		var lastTimePart=''
		var needAnd=false
		var needComma=false
		for (id in timeframes) {
			if (id=='second') {
				s=Math.floor(s)
				if (s>0) {
					if (lastTimePart!='') {
						if (timeFormat=='') {
							timeFormat=lastTimePart
							needAnd=true
						} else {
							timeFormat=timeFormat+', '+lastTimePart
							needComma=true
						}
					}
					lastTimePart=s+(s==1?' second':' seconds')
				}
			} else if (id=='year') {
				var amount=Math.floor(s/31556952)
				if (amount>0) {
					s-=amount*31556952
					lastTimePart=amount+(amount==1?' year':' years')
				}
			} else {
				var amount=Math.floor(s/timeframes[id])
				if (amount>0) {
					s-=amount*timeframes[id]
					if (lastTimePart!='') {
						if (timeFormat=='') {
							timeFormat=lastTimePart
							needAnd=true
						} else {
							timeFormat=timeFormat+', '+lastTimePart
							needComma=true
						}
					}
					lastTimePart=amount+' '+id+(amount==1?'':'s')
				}
			}
		}
		return timeFormat+(needComma?',':'')+(needAnd?' and ':'')+lastTimePart
	} else {
		return 'eternity'
	}
}

//Options
function toggle_auto_save() {
	game.options.auto_save = !game.options.auto_save
	document.getElementById("auto_save").textContent = "Auto save: " + (game.options.auto_save ? "ON" : "OFF")
}

function toggle_offline_progress() {
	game.options.offline_progress = !game.options.offline_progress
	document.getElementById("offline_progress").textContent = "Offline progress: " + (game.options.offline_progress ? "ON" : "OFF")
}

function change_tick_rate() {
	game.options.tick_rate = game.options.tick_rate % 60 + 5
	document.getElementById("tick_rate").textContent = "Tick rate: " + game.options.tick_rate + "/s"
	clearInterval(game_loop)
	game_loop = setInterval(game_tick, 1000/game.options.tick_rate)
}

function get_theme_name() {
	var msg = ""
	if (game.options.theme.color != 5) msg = ([null, "Red", "Orange", "Yellow", "Lime", null, "Jade", "Cyan", "Water", "Blue", "Purple", "Pink", "Red Beryl"])[game.options.theme.color]
	if (game.options.theme.dark) {
		if (msg == "") msg = "Dark"
		else msg += " Dark"
	}
	if (game.options.theme.light) {
		if (msg == "") msg = "Light"
		else msg += " Light"
	}
	if (msg == "") return "Normal"
	else return msg
}

function update_theme() {
	var root = document.documentElement

	if (game.options.theme.light) root.style.setProperty('--background', "rgb(255, 255, 255)")
	else root.style.setProperty('--background', "rgb(0, 0, 0)")

	var mult = 256
	if (game.options.theme.light) mult /= 2
	if (game.options.theme.dark) mult *= 0.75
	var value1 = Math.min(2 - ((game.options.theme.color - 1) % 4) / 2, 1) * mult - 1
	var value2 = Math.min(((game.options.theme.color - 1) % 4) / 2, 1) * mult - 1
	
	var rgb
	if (game.options.theme.color > 8) rgb = [value2, 0, value1]
	else if (game.options.theme.color > 4) rgb = [0, value1, value2]
	else rgb = [value1, value2, 0]

	root.style.setProperty('--color', "rgb(" + rgb[0] + ", " + rgb[1] + ", " + rgb[2] + ")")
}

function change_theme_color(id) {
	game.options.theme.color = id
	document.getElementById("theme").textContent = "Theme: " + get_theme_name()
	document.getElementById("theme_color").textContent = "Color: " + ([null, "Red", "Orange", "Yellow", "Lime", "Green", "Jade", "Cyan", "Water", "Blue", "Purple", "Pink", "Red Beryl"])[game.options.theme.color]
	update_theme()
}

function toggle_theme_light() {
	game.options.theme.light = !game.options.theme.light
	document.getElementById("theme").textContent = "Theme: " + get_theme_name()
	document.getElementById("theme_light").textContent = "Light: " + (game.options.theme.light ? "ON" :  "OFF")
	update_theme()
}

function toggle_theme_dark() {
	game.options.theme.dark = !game.options.theme.dark
	document.getElementById("theme").textContent = "Theme: " + get_theme_name()
	document.getElementById("theme_dark").textContent = "Dark: " + (game.options.theme.dark ? "ON" :  "OFF")
	update_theme()
}

function change_notation() {
	if (game.options.notation == "Scientific") game.options.notation = "Engineering"
	else if (game.options.notation == "Engineering") game.options.notation = "Logarithm"
	else if (game.options.notation == "Logarithm") game.options.notation = "Standard"
	else if (game.options.notation == "Standard") game.options.notation = "Letters"
	else if (game.options.notation == "Letters") game.options.notation = "Scientific"
	else return
	update_words()
	document.getElementById("notation").textContent = "Notation: " + game.options.notation
}

//Age 1: The Hub
//Stage 1-1: Data
function produce(id, loaded) {
	if (id == game.production && (!game.options.locked_bits_production || game.production != "bits" || can_produce("bits")) && !loaded) id = null
	if (game.production) document.getElementById("produce_"+game.production).textContent = "Produce"
	game.production = id
	if (id && can_produce(id)) document.getElementById("produce_"+id).textContent = "Producing"
}

function can_produce(currency) {
	if (currency == "bits") return game.bits < get_bit_capacity()
	if (currency == "bytes") return game.bits > 0
	return true
}

function get_bit_production() {
	return Math.pow(1.5, game.upgrades[0]) * get_total_file_boost() * get_words_boost()
}

function get_bit_capacity() {
	return Math.floor(32 * Math.pow(1.5, game.upgrades[1]) * get_words_boost())
}

function lock_bits_production() {
	game.options.locked_bits_production = !game.options.locked_bits_production
	document.getElementById("lock_bits_production").textContent = "Locked bits production: " + (game.options.locked_bits_production ? "ON" : "OFF")
}

function get_byte_production() {
	return 0.5 * Math.pow(1.5, game.upgrades[2]) * get_total_file_boost() * get_words_boost()
}

function update_upgrade(id) {
	if (tab_name != "upgrades") return
	var message = ""
	if (id == 1) message = "Increase the bit production by 50%."
	if (id == 2) message = "Increase the bit capacity by 50%."
	if (id == 3) message = "Increase the byte production by 50%."
	message += "<br><br>Level: " + game.upgrades[id - 1] + "<br>Currently: " + format(Math.pow(1.5, game.upgrades[id - 1]), 1) + "x"
	document.getElementById("upgrade_" + id).innerHTML = message
	document.getElementById("upgrade_" + id + "_button").textContent = "Cost: " + format(get_upgrade_cost(id)) + " bytes"
}

function get_upgrade_cost(id) {
	if (id == 1) return Math.pow(2, game.upgrades[0] + 1) / get_total_computer_boost()
	if (id == 2) return Math.pow(1.5, game.upgrades[1]) * 2
	if (id == 3) return Math.pow(2, game.upgrades[2] + 3) / get_total_computer_boost()
}

function buy_upgrade(id) {
	if (game.bytes < get_upgrade_cost(id)) return
	game.bytes -= get_upgrade_cost(id)
	game.upgrades[id - 1]++
	game.statistics.total_upgrades++
	update_upgrade(id)
	if (tab_name == "statistics") update_tab_on_switch("statistics")
}

function max_upgrades() {
	if (game.bytes >= get_upgrade_cost(3)) {
		var toBuy = Math.floor(Math.log10(game.bytes / get_upgrade_cost(3) + 1) / Math.log10(2))
		game.bytes = Math.max(game.bytes - (Math.pow(2, toBuy) - 1) * get_upgrade_cost(3), 0)
		game.upgrades[2] += toBuy
		game.statistics.total_upgrades += toBuy
		update_upgrade(3)
	}
	if (game.bytes >= get_upgrade_cost(1)) {
		var toBuy = Math.floor(Math.log10(game.bytes / get_upgrade_cost(1) + 1) / Math.log10(2))
		game.bytes = Math.max(game.bytes - (Math.pow(2, toBuy) - 1) * get_upgrade_cost(1), 0)
		game.upgrades[0] += toBuy
		game.statistics.total_upgrades += toBuy
		update_upgrade(1)
	}
	if (game.bytes >= get_upgrade_cost(2)) {
		var toBuy = Math.floor(Math.log10(game.bytes / get_upgrade_cost(2) / 2 + 1) / Math.log10(1.5))
		game.bytes = Math.max(game.bytes - (Math.pow(1.5, toBuy) - 1) * 2 * get_upgrade_cost(2), 0)
		game.upgrades[1] += toBuy
		game.statistics.total_upgrades += toBuy
		update_upgrade(2)
	}
	if (tab_name == "statistics") update_tab_on_switch("statistics")
}

//Stage 1-2: Files
function unlock_files() {
	if (game.bytes < 64) return
	game.bytes -= 64
	game.files.unlocked = true
	update_tab_on_switch("files")
	document.getElementById("tab_button_computers").style.display = ""
}

function update_file(id) {
	if (tab_name != "files") return
	var msg = "File #" + id + "<br>Multiplier: " + format(get_file_boost(id), 1) + "x<br>" + format(game.files[id].bits) + " bits"
	if (game.statistics.times_transfer > 0) msg += " & " + format(game.files[id].words) + " words"
	document.getElementById("file_" + id).innerHTML = msg
}

function inject_data(id) {
	if (game.bits < 1) return
	var add = Math.ceil(Math.floor(game.bits) * game.files.percentage / 100)
	game.bits -= add
	game.files[id].bits += add
	game.statistics.bits_injected += add
	if (game.computers.unlocked) if (is_autobuyer_on(id + 13)) if (game.computers[id].exp + game.files[id].bits > get_level_requirement(id) && !game.computers[id].is_server) computer_dissolve(id, true)
	update_file(id)
	if (game.options.locked_bits_production) document.getElementById("produce_bits").textContent = "Producing"
	if (tab_name == "files") document.getElementById("total_file_boost").innerHTML = "<b>Total multiplier on bit and byte productions</b>: " + format(get_total_file_boost(), 1) + "x"
	if (tab_name == "computers") {
		if (game.computers.unlocked) update_select_file_button(id)
		else document.getElementById("total_file_boost_computers").innerHTML = "<b>Total multiplier on bit and byte productions</b>: " + format(get_total_file_boost(), 1) + "x"
	}
	if (tab_name == "statistics") update_tab_on_switch("statistics")
}

function select_percentage(percentage) {
	game.files.percentage = percentage
	document.getElementById("percentage_to_be_injected").innerHTML = "<b>Percentage of data to be injected</b>: " + (Math.round(percentage * 10) / 10) + "%"
}

function get_file_boost(file) {
	var ret = 1
	if (game.files.unlocked) ret = Math.log10(game.files[file].bits / 256 + 1) / 4 + 1
	if (game.statistics.times_transfer > 0) ret *= Math.log10(game.files[file].words * 4 + 1) + 1
	return ret
}

function get_total_file_boost() {
	var product = 1
	for (var file=1; file<9; file++) product *= get_file_boost(file)
	return product
}

//Stage 1-3: Computers
function unlock_computers() {
	if (get_total_file_boost() < 512) return
	game.computers.unlocked = true
	update_tab_on_switch("computers")
	document.getElementById("tab_button_transfer").style.display = ""
}

function select_file(id) {
	if (game.files[id].bits == 0 && (!game.computers.servers_unlocked || game.files[id].words == 0)) return
	game.computers.file_selected = id
	document.getElementById("file_selected").innerHTML = "<b>File selected</b>: #" + id
}

function update_select_file_button(file) {
	if (tab_name != "computers") return
	var msg = "File #" + file + "<br>" + format(game.files[file].bits) + " bits"
	if (game.computers.servers_unlocked) msg += "<br>" + format(game.files[file].words) + " words"
	document.getElementById("select_file_" + file).innerHTML = msg
}

function update_computer(id) {
	if (tab_name != "computers") return
	var msg = (game.computers[id].is_server ? "Server" : "Computer") + " #" + id
	if (game.computers[id].is_server) msg += ""
	else if (game.computers[id].level > 0 || !game.computers.servers_unlocked) msg += "<br>Multiplier: " + format(Math.pow(2, Math.sqrt(game.computers[id].level) * data.computer_strength), 1) + "x"
	msg += "<br>Level: " + game.computers[id].level
	if (game.computers[id].is_server) msg += "<br>SXP: " + format(game.computers[id].sxp) + "<br>Next: " + format(get_server_requirement(id))
	else {
		msg += "<br>EXP: " + format(game.computers[id].exp)
		if (game.computers[id].level == 0 && game.computers.servers_unlocked) msg += " | SXP: " + format(game.computers[id].sxp)
		msg += "<br>Next: " + format(get_level_requirement(id))
		if (game.computers[id].level == 0 && game.computers.servers_unlocked) msg += " EXP<br>To server: 512 SXP"
	}
	document.getElementById("computer_" + id).innerHTML = msg
	document.getElementById("computer_" + id + "_button_secondary").style.display = game.computers[id].level > 0 || !game.computers.servers_unlocked ? "none" : ""
}

function get_level_requirement(comp) {
	return Math.pow(2, game.computers[comp].level + 24)
}

function computer_dissolve(comp, auto) {
	var selected = auto ? comp : game.computers.file_selected
	if (!auto && game.computers.file_selected == null) return
	if (game.computers[comp].is_server) return
	game.computers[comp].exp += game.files[selected].bits
	game.statistics.total_exp += game.files[selected].bits
	game.files[selected].bits = 0
	game.statistics.files_dissolved++
	update_select_file_button(selected)
	update_file(selected)
	if (!auto) {
		game.computers.file_selected = null
		document.getElementById("file_selected").innerHTML = "<b>File selected</b>: None"
	}
	var req = get_level_requirement(comp)
	if (game.computers[comp].exp >= req) {
		var add = Math.floor(Math.log10(game.computers[comp].exp / req + 1) / Math.log10(2))
		game.computers[comp].exp = Math.max(game.computers[comp].exp - (Math.pow(2, add) - 1) * req, 0)
		game.computers[comp].level += add
		game.statistics.total_levelups += add
		document.getElementById("total_computer_boost").innerHTML = "<b>Total multiplier discount on upgrades 1 and 3</b>: " + format(get_total_computer_boost(), 1) + "x"
		if (tab_name == "transfer") {
			var total = 0
			if (game.computers.unlocked) for (var comp=1; comp<5; comp++) total += game.computers[comp].level
			document.getElementById("total_computer_levels").innerHTML = "<b>Total computer levels</b>: " + total
		}
	}
	if (tab_name == "upgrades") {
		update_upgrade(1)
		update_upgrade(3)
	}
	if (tab_name == "statistics") update_tab_on_switch("statistics")
	update_computer(comp)
}

function primary_computer_dissolve(comp) {
	if (game.computers[comp].is_server) dissolve_for_sxp(comp)
	else computer_dissolve(comp)
}

function get_total_computer_boost() {
	var product = 1
	if (game.computers.unlocked) for (var comp=1; comp<5; comp++) if (!game.computers[comp].is_server) product *= Math.pow(2, Math.sqrt(game.computers[comp].level) * data.computer_strength)
	return product
}

function update_computers_data() {
	data.computer_strength = 1
	data.normal_computers = 4
	for (var comp=1; comp<5; comp++) if (game.computers[comp].is_server) {
		data.computer_strength += Math.pow(game.computers[comp].level, 0.25)
		data.normal_computers--
	}
	if (data.normal_computers < 3) data.computer_strength *= (1 - Math.abs(data.normal_computers - 2) / 2)
	data.computer_strength *= 2 / data.normal_computers / Math.sqrt(2)
}

//Stage 1-4: Transfer
function get_words_gain() {
	return Math.floor(Math.pow(game.bytes, 0.125) / 128)
}

function transfer() {
	var total = 0
	var transfer_requirement = 160
	if (game.computers.unlocked) for (var comp=1; comp<5; comp++) {
		if (game.computers[comp].is_server) transfer_requirement -= 40
		else total += game.computers[comp].level
	}
	if (total < transfer_requirement) return
	var add = get_words_gain()
	if (add < 1) return
	if (game.statistics.times_transfer == 0) update_autobuyers()
	produce()
	game.statistics.times_transfer++
	game.statistics.fastest_transfer = Math.min(game.statistics.time_this_transfer, game.statistics.fastest_transfer)
	game.statistics.time_this_transfer = 0
	game.transfer.words += add
	game.statistics.total_words += add
	game.bits = 0
	game.bytes = 0
	game.upgrades = [0,0,0]
	if (game.files.unlocked === true) game.files.unlocked = false
	if (game.computers.unlocked === true) game.computers.unlocked = false
	for (var file=1; file<9; file++) game.files[file].bits = 0
	for (var comp=1; comp<5; comp++) game.computers[comp] = {exp: 0, level: 0, sxp: 0, is_server: false}
	game.transfer.words_gain_rate_peak = 0
	document.getElementById("total_computer_levels").innerHTML = "<b>Total computer levels</b>: 0"
	update_computers_data()
	update_words()
	if (is_autobuyer_on(1)) produce("bits")
	if (tab_name == "statistics") update_tab_on_switch("statistics")
	if (game.statistics.fastest_transfer < 10) get_feat(1)
}

function update_words() {
	if (game.statistics.times_transfer > 0) {
		document.getElementById("words_div").style.display = ""
		document.getElementById("words").innerHTML = "<b>Words</b>: " + format(game.transfer.words)
		document.getElementById("words_multiplier").textContent = format(get_words_boost(), 1) + "x on productions & bit capacity"
		document.getElementById("automation").style.display = ""
	} else {
		document.getElementById("words_div").style.display = "none"
		document.getElementById("automation").style.display = "none"
	}
}

function get_words_boost() {
	if (game.statistics.times_transfer > 0) return Math.log10(game.transfer.words * 4 + 1) + 1
	return 1
}

function inject_words(id) {
	if (game.transfer.words < 1) return
	var add = Math.ceil(game.transfer.words * game.files.percentage / 100)
	game.transfer.words -= add
	game.files[id].words += add
	game.statistics.words_injected += add
	update_words()
	update_file(id)
	document.getElementById("total_file_boost").innerHTML = "<b>Total multiplier on bit and byte productions</b>: " + format(get_total_file_boost(), 1) + "x"
}

function inject_equally() {
	for (var file=1; file<9; file++) {
		var add = Math.ceil(Math.floor(game.transfer.words) / (9 - file))
		if (add == 0) break
		game.transfer.words -= add
		game.files[file].words += add
		game.statistics.words_injected += add
		update_file(file)
	}
	update_words()
	document.getElementById("total_file_boost").innerHTML = "<b>Total multiplier on bit and byte productions</b>: " + format(get_total_file_boost(), 1) + "x"
}

var autobuyer_names = [null, "Bit Production", "Byte Production", "Upgrade #1", "Upgrade #2", "Upgrade #3", "File #1", "File #2", "File #3", "File #4", "File #5", "File #6", "File #7", "File #8", "Computer #1", "Computer #2", "Computer #3", "Computer #4"]
function get_autobuyer_cost() {
	return Math.ceil(Math.pow(2, game.transfer.autobuyers_unlocked / 2))
}

function update_autobuyers() {
	if (game.transfer.autobuyers_unlocked == 17) document.getElementById("buy_autobuyer").style.display = "none"
	else {
		document.getElementById("buy_autobuyer").style.display = ""
		document.getElementById("buy_autobuyer").innerHTML = "Buy " + autobuyer_names[game.transfer.autobuyers_unlocked + 1] + " Autobuyer<br>Cost: " + get_autobuyer_cost() + " words"
	}
	for (var autobuyer=1; autobuyer<18; autobuyer++) {
		if (autobuyer > game.transfer.autobuyers_unlocked) document.getElementById("autobuyer_" + autobuyer).style.display = "none"
		else {
			document.getElementById("autobuyer_" + autobuyer).style.display = ""
			document.getElementById("autobuyer_" + autobuyer + "_toggle").textContent = game.transfer.automation[autobuyer] ? "ON" : "OFF"
		}
	}
}

function buy_autobuyer() {
	if (game.transfer.words < get_autobuyer_cost()) return
	game.transfer.words -= get_autobuyer_cost()
	game.transfer.autobuyers_unlocked++
	game.transfer.automation[game.transfer.autobuyers_unlocked] = true
	update_words()
	update_autobuyers()
}

function toggle_autobuyer(autobuyer) {
	game.transfer.automation[autobuyer] = !game.transfer.automation[autobuyer]
	document.getElementById("autobuyer_" + autobuyer + "_toggle").textContent = game.transfer.automation[autobuyer] ? "ON" : "OFF"
}

function is_autobuyer_on(autobuyer) {
	if (autobuyer > game.transfer.autobuyers_unlocked) return false
	return game.transfer.automation[autobuyer]
}

function perm_unlock_files() {
	if (game.transfer.words < 16) return
	game.transfer.words -= 16
	game.files.unlocked = 2
	update_tab_on_switch("files")
	update_words()
}

function perm_unlock_computers() {
	if (game.transfer.words < 256) return
	game.transfer.words -= 256
	game.computers.unlocked = 2
	update_tab_on_switch("computers")
	update_words()
}

//Stage 1-5: Servers
function unlock_servers() {
	if (game.transfer.words < 512) return
	game.transfer.words -= 512
	game.computers.servers_unlocked = true
	update_tab_on_switch("computers")
	update_words()
	document.getElementById("tab_button_feats").style.display = ""
	if (game.statistics.fastest_transfer < 10) game.feats.achieved.push(1)
}

function get_server_requirement(comp) {
	return Math.pow(2, game.computers[comp].level + 9)
}

function dissolve_for_sxp(comp) {
	if (game.computers.file_selected == null) return
	if (!game.computers[comp].is_server && game.computers[comp].level > 0) return
	var add = game.files[game.computers.file_selected].words
	game.transfer.words += add
	game.files[game.computers.file_selected].words = 0
	game.computers[comp].sxp += add
	game.statistics.files_dissolved++
	game.statistics.total_sxp += add
	update_select_file_button(comp)
	var req = get_server_requirement(comp)
	if (game.computers[comp].sxp >= req) {
		var add = Math.floor(Math.log10(game.computers[comp].sxp / req + 1) / Math.log10(2))
		game.computers[comp].sxp = Math.max(game.computers[comp].sxp - (Math.pow(2, add) - 1) * req, 0)
		if (!game.computers[comp].is_server) {
			game.computers[comp].is_server = true
			game.statistics.servers_made++
		}
		game.computers[comp].level += add
		game.statistics.total_levelups += add
		update_computers_data()
		for (var comp2=1; comp2<5; comp2++) if (!game.computers[comp2].is_server) update_computer(comp2)
		document.getElementById("total_computer_boost").innerHTML = "<b>Total multiplier discount on upgrades 1 and 3</b>: " + format(get_total_computer_boost(), 1) + "x"
		if (tab_name == "transfer") {
			var total = 0
			if (game.computers.unlocked) for (var comp=1; comp<5; comp++) total += game.computers[comp].level
			document.getElementById("total_computer_levels").innerHTML = "<b>Total computer levels</b>: " + total
		}
	}
	update_computer(comp)
	update_words()
}

function get_feat(id) {
	if (!game.computers.servers_unlocked) return
	if (game.feats.achieved.includes(id)) return
	game.feats.achieved.push(id)
	game.feats.notifications++
	document.getElementById("feat_achieved").style.opacity = 1
	setTimeout(function(){document.getElementById("feat_achieved").style.opacity = 0;}, 5000)
	document.getElementById("tab_button_feats").textContent = "Feats (" + game.feats.notifications + ")"
}