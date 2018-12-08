function save_game() {
	localStorage.setItem(btoa("productive_data"), btoa(JSON.stringify(game)))
}

function load_game(save_file) {
	if (save_file === undefined) save_file = localStorage.getItem(btoa("productive_data"))
	if (save_file !== null) {
		var safe_save = JSON.parse(atob(save_file))
		update_save(safe_save)
		stop_interval()
		game = safe_save
		produce(game.production)
		update_tab_buttons()
		update_theme()
		if (tab_name == "options") update_tab_on_switch("options")
		update_words()
		if (!game.options.offline_progress) game.lastTick = new Date().getTime()
	}
}

function update_save(save_file) {
	if (compare_version(save_file.version, "0.1.2.0")) {
		save_file.files = {unlocked: false}
		for (var id=1; id<9; id++) save_file.files[id] = 0
		save_file.statistics.total_upgrades = save_file.upgrades[0] + save_file.upgrades[1] + save_file.upgrades[2]
		save_file.statistics.bits_injected = 0
		save_file.options.theme = {
			color: 5,
			light: save_file.options.theme == "Light",
			dark: save_file.options.theme == "Dark"
		}
	}
	if (compare_version(save_file.version, "0.1.3.0")) {
		save_file.computers = {unlocked: false, file_selected: null}
		for (var id=1; id<5; id++) save_file.computers[id] = {exp: 0, level: 0}
		save_file.statistics.files_dissolved = 0
		save_file.statistics.exp_gained = 0
		save_file.statistics.total_levelups = 0
	}
	if (compare_version(save_file.version, "0.1.3.1")) {
		save_file.statistics.total_exp = save_file.statistics.exp_gained
		for (var comp=1; comp<5; comp++) save_file.statistics.total_levelups += save_file.computers[comp].level
		delete save_file.statistics.exp_gained
	}
	if (compare_version(save_file.version, "0.1.4.0")) {
		save_file.files.percentage = 100
		for (var file=1; file<9; file++) save_file.files[file] = {bits: save_file.files[file], words: 0}
		save_file.transfer = {
			words: 0,
			words_gain_rate_peak: 0,
			automation: {},
			autobuyers_unlocked: 0
		}
		save_file.statistics.times_transfer = 0
		save_file.statistics.time_this_transfer = save_file.statistics.playtime
		save_file.statistics.fastest_transfer = 1/0
		save_file.statistics.total_words = 0
		save_file.statistics.words_injected = 0
		save_file.options.auto_save = true
		save_file.options.offline_progress = true
		save_file.options.locked_bits_production = false
	}
	save_file.version = "0.1.4.1"
}

function compare_version(ver1, ver2) {
	var ver1_data = ver1.split(".")
	var ver2_data = ver2.split(".")
	
	for (var layer=1;layer<4;layer++) {
		var number1 = parseInt(ver1_data[layer])
		var number2 = parseInt(ver2_data[layer])
		if (number1 > number2) return false
		if (number1 < number2) return true
	}
	return false
}

function export_save() {
	var save_file = btoa(JSON.stringify(game))
	document.getElementById("exported_save_text").value = save_file
	document.getElementById("exported_save").style.display = "block"
}

function export_save_safe() {
	var save_file = localStorage.getItem(btoa("productive_data"))
	if (save_file === null) return
	document.getElementById("exported_save_safe_text").value = save_file
	document.getElementById("exported_save_safe").style.display = "block"
}

function import_save() {
	var save_file = prompt("Please enter your exported save to import. WARNING: Your current save will be overwritten!")
	if (save_file !== null) {
		load_game(save_file)
		save_game()
		start_interval()
	}
}

function hard_reset() {
	if (!confirm("Hard resetting your save erases everything, including your options and statistics. ARE YOU REALLY WANT TO DO THIS? YOU CAN'T UNDO THIS!")) return
	stop_interval()
	produce()
	game = get_default_player()
	save_game()
	update_tab_buttons()
	update_theme()
	update_tab_on_switch("options")
	update_words()
	start_interval()
}