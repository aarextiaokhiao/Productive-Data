function get_default_player() {
	return {
		production: null,
		bits: 0,
		bytes: 0,
		upgrades: [0,0,0],
		statistics: {
			playtime: 0,
			total_bits: 0,
			total_bytes: 0
		},
		options: {
			tick_rate: 30,
			notation: "Scientific",
			theme: "Normal",
		},
		version: "0.1.1.0",
		lastTick: new Date().getTime()
	}
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
	document.getElementById("bytes").innerHTML = "<b>Bytes</b>: " + format(game.bytes)
	
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
	else if (game.options.notation == "Engineering") {
		var places = exponent % 3
		return (mantissa * Math.pow(10, places)).toFixed(3 - places) + "e" + (exponent - places)
	}
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

function change_theme() {
	if (game.options.theme == "Normal") game.options.theme = "Light"
	else if (game.options.theme == "Light") game.options.theme = "Dark"
	else if (game.options.theme == "Dark") game.options.theme = "Normal"
	else return
	document.getElementById("theme").textContent = "Theme: " + game.options.theme
	update_theme()
}

function update_theme() {
	if (game.options.theme == "Normal") document.body.className = "normal-theme"
	else if (game.options.theme == "Light") document.body.className = "light-theme"
	else if (game.options.theme == "Dark") document.body.className = "dark-theme"
}

function change_notation() {
	if (game.options.notation == "Scientific") game.options.notation = "Engineering"
	else if (game.options.notation == "Engineering") game.options.notation = "Logarithm"
	else if (game.options.notation == "Logarithm") game.options.notation = "Scientific"
	else return
	document.getElementById("notation").textContent = "Notation: " + game.options.notation
}

//Age 1: The Hub
//Stage 1-1: Data
function produce(id) {
	if (!can_produce(id)) return
	if (game.production) document.getElementById("produce_"+game.production).textContent = "Produce"
	if (id) {
		document.getElementById("produce_"+id).textContent = "Producing"
		game.production = id
	}
}

function can_produce(currency) {
	if (currency == "bits") return game.bits < get_bit_capacity()
	if (currency == "bytes") return game.bits > 0
	return true
}

function get_bit_production() {
	return 1 * Math.pow(1.5, game.upgrades[0])
}

function get_bit_capacity() {
	return Math.floor(32 * Math.pow(1.5, game.upgrades[1]))
}

function get_byte_production() {
	return 0.5 * Math.pow(1.5, game.upgrades[2])
}

function update_upgrade(id) {
	var message = ""
	if (id == 1) message = "Increase the bit production by 50%."
	if (id == 2) message = "Increase the bit capacity by 50%."
	if (id == 3) message = "Increase the byte production by 50%."
	message += "<br><br>Level: " + game.upgrades[id - 1] + "<br>Currently: "
	if (id == 1) message += format(get_bit_production(), 1) + "/s"
	if (id == 2) message += format(get_bit_capacity())
	if (id == 3) message += format(get_byte_production(), 1) + "/s"
	document.getElementById("upgrade_" + id).innerHTML = message
	document.getElementById("upgrade_" + id + "_button").textContent = "Cost: " + format(get_upgrade_cost(id)) + " bytes"
}

function get_upgrade_cost(id) {
	if (id == 3) return Math.pow(2, game.upgrades[2] + 3)
	if (id == 1 || id == 2) return Math.pow(2, game.upgrades[id - 1] + 1)
}

function buy_upgrade(id) {
	if (game.bytes < get_upgrade_cost(id)) return
	game.bytes -= get_upgrade_cost(id)
	game.upgrades[id - 1]++
	update_upgrade(id)
}