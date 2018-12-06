function get_default_player() {
	var default_player = {
		production: null,
		bits: 0,
		bytes: 0,
		upgrades: [0,0,0],
		files: {unlocked: false},
		statistics: {
			playtime: 0,
			total_bits: 0,
			total_bytes: 0,
			total_upgrades: 0,
			bits_injected: 0
		},
		options: {
			tick_rate: 30,
			notation: "Scientific",
			theme: {
				color: 5,
				light: false,
				dark: false
			}
		},
		version: "0.1.2.0",
		lastTick: new Date().getTime()
	}
	for (var id=1; id<9; id++) default_player.files[id] = 0
	return default_player
}

function game_tick() {
	var diff = new Date().getTime() - game.lastTick
	game.lastTick += diff
	diff /= 1e3

	game.statistics.playtime += diff
	
	if (game.production == "bits") {
		var add = Math.min(get_bit_production() * diff, get_bit_capacity() - game.bits)
		game.bits += add
		game.statistics.total_bits += add
	} else if (game.production == "bytes") {
		var add = Math.min(get_byte_production() * diff, game.bits / 8)
		game.bits -= add * 8
		game.bytes += add
		game.statistics.total_bytes += add
	}
	if (!can_produce(game.production)) produce()
	
	document.getElementById("bits").innerHTML = "<b>Bits</b>: " + format(game.bits) + " / " + format(get_bit_capacity())
	document.getElementById("bits_production").innerHTML = format(get_bit_production(), 1) + "/s"
	document.getElementById("bytes").innerHTML = "<b>Bytes</b>: " + format(game.bytes)
	document.getElementById("bytes_production").innerHTML = format(get_byte_production(), 1) + "/s"
	
	if (tab_name == "statistics") {
		document.getElementById("playtime").textContent = format_time(game.statistics.playtime)
		document.getElementById("total_bits").textContent = format(game.statistics.total_bits)
		document.getElementById("total_bytes").textContent = format(game.statistics.total_bytes)
	}
}

var game_loop
var auto_save
function start_interval() {
	game_loop = setInterval(game_tick, 1000/game.options.tick_rate)
	auto_save = setInterval(save_game, 3e4)
}

function stop_interval() {
	clearInterval(game_loop)
	clearInterval(auto_save)
}

function init_game() {
	game = get_default_player()
	load_game()
	tab_name = "stuck"
	switch_tab("upgrades")
	start_interval()
}

//Formatting
function format(num, places) {
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
	else if (game.options.notation == "Standard") return (mantissa * Math.pow(10, places)).toFixed(3 - places) + (["k", "M", "B", "T", "Qa"])[Math.floor(exponent / 3) - 1]
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
function change_tick_rate() {
	game.options.tick_rate = game.options.tick_rate % 60 + 5
	document.getElementById("tick_rate").textContent = "Tick rate: " + game.options.tick_rate + "/s"
	clearInterval(game_loop)
	game_loop = setInterval(game_tick, 1000/game.options.tick_rate)
}

function get_theme_name() {
	var msg = ""
	if (game.options.theme.color != 5) msg = ([null, "Red", "Orange", "Yellow", "Lime", null, "Aqua", "Cyan", "Water", "Blue", "Purple", "Pink", "Red Beryl"])[game.options.theme.color]
	if (game.options.theme.dark) {
		if (msg == "") msg = "Dark"
		else msg += " Dark"
	}
	if (game.options.theme.light) {
		if (msg == "") msg = "Light"
		else msg += " Light"
	}
	if (msg == "") return "Normal"
	if (msg == "Red Beryl Dark Light") return "R.B. Dark Light"
	else return msg
}

function update_theme() {
	var root = document.documentElement

	if (game.options.theme.light) root.style.setProperty('--background', "rgb(255, 255, 255)")
	else root.style.setProperty('--background', "rgb(0, 0, 0)")

	var value1 = 255
	var value2 = 0
	if (game.options.theme.color % 4 == 3 || game.options.theme.color % 4 == 0) value2 = 255
	else if (game.options.theme.color % 4 == 2) value2 = 127
	if (game.options.theme.color % 4 == 0) value1 = 127
	
	var rgb
	if (game.options.theme.color > 8) rgb = [value2, 0, value1]
	else if (game.options.theme.color > 4) rgb = [0, value1, value2]
	else rgb = [value1, value2, 0]
	
	if (game.options.theme.light) {
		rgb[0] = (rgb[0] + 1) / 2 - 1
		rgb[1] = (rgb[1] + 1) / 2 - 1
		rgb[2] = (rgb[2] + 1) / 2 - 1
	}
	if (game.options.theme.dark) {
		rgb[0] = (rgb[0] + 1) * 0.75 - 1
		rgb[1] = (rgb[1] + 1) * 0.75 - 1
		rgb[2] = (rgb[2] + 1) * 0.75 - 1
	}
	root.style.setProperty('--color', "rgb(" + rgb[0] + ", " + rgb[1] + ", " + rgb[2] + ")")
}

function change_theme_color(id) {
	game.options.theme.color = id
	document.getElementById("theme").textContent = "Theme: " + get_theme_name()
	document.getElementById("theme_color").textContent = "Color: " + ([null, "Red", "Orange", "Yellow", "Lime", "Green", "Aqua", "Cyan", "Water", "Blue", "Purple", "Pink", "Red Beryl"])[game.options.theme.color]
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
	else if (game.options.notation == "Standard") game.options.notation = "Scientific"
	else return
	document.getElementById("notation").textContent = "Notation: " + game.options.notation
}

//Age 1: The Hub
//Stage 1-1: Data
function produce(id) {
	if (id == game.production) id = null
	if (!can_produce(id)) return
	if (game.production) document.getElementById("produce_"+game.production).textContent = "Produce"
	if (id) document.getElementById("produce_"+id).textContent = "Producing"
	game.production = id
}

function can_produce(currency) {
	if (currency == "bits") return game.bits < get_bit_capacity()
	if (currency == "bytes") return game.bits > 0
	return true
}

function get_bit_production() {
	return Math.pow(1.5, game.upgrades[0]) * get_total_file_boost()
}

function get_bit_capacity() {
	return Math.floor(32 * Math.pow(1.5, game.upgrades[1]))
}

function get_byte_production() {
	return 0.5 * Math.pow(1.5, game.upgrades[2]) * get_total_file_boost()
}

function update_upgrade(id) {
	var message = ""
	if (id == 1) message = "Increase the bit production by 50%."
	if (id == 2) message = "Increase the bit capacity by 50%."
	if (id == 3) message = "Increase the byte production by 50%."
	message += "<br><br>Level: " + game.upgrades[id - 1] + "<br>Currently: "
	if (id == 1) message += format(Math.pow(1.5, game.upgrades[0]), 1) + "x"
	if (id == 2) message += format(get_bit_capacity())
	if (id == 3) message += format(Math.pow(1.5, game.upgrades[2]), 1) + "x"
	document.getElementById("upgrade_" + id).innerHTML = message
	document.getElementById("upgrade_" + id + "_button").textContent = "Cost: " + format(get_upgrade_cost(id)) + " bytes"
}

function get_upgrade_cost(id) {
	if (id == 1) return Math.pow(2, game.upgrades[id - 1] + 1)
	if (id == 2) return Math.pow(1.5, game.upgrades[id - 1]) * 2
	if (id == 3) return Math.pow(2, game.upgrades[2] + 3)
}

function buy_upgrade(id) {
	if (game.bytes < get_upgrade_cost(id)) return
	game.bytes -= get_upgrade_cost(id)
	game.upgrades[id - 1]++
	game.statistics.total_upgrades++
	update_upgrade(id)
}

//Stage 1-2: Files
function unlock_files() {
	if (game.bytes < 64) return
	game.bytes -= 64
	game.files.unlocked = true
	update_tab_on_switch("files")
}

function update_file(id) {
	document.getElementById("file_" + id).innerHTML = "File #" + id + "<br>Multiplier: " + format(Math.log10(game.files[id] + 1) / 4 + 1, 1) + "x<br>" + format(game.files[id]) + " bits"
}

function inject_data(id) {
	if (game.bits < 1) return
	var add = Math.floor(game.bits)
	game.bits -= add
	game.files[id] += add
	game.statistics.bits_injected += add
	update_file(id)
	document.getElementById("total_file_boost").innerHTML = "<b>Total multiplier on bit and byte productions</b>: " + format(get_total_file_boost(), 1) + "x"
}

function get_total_file_boost() {
	var product = 1
	if (game.files.unlocked) for (var file=1; file<9; file++) product *= Math.log10(game.files[file] + 1) / 4 + 1
	return product
}