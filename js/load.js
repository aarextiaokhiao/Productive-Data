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
		update_theme()
	}
}

function update_save(save_file) {
	//FUTURE CODE
	if (compare_version(save_file.version, "0.1.2.0")) {
		
	}
	save_file.version = "0.1.1.0"
}

function compare_version(ver1, ver2) {
	var ver1_data = ver1.split(".")
	var ver2_data = ver2.split(".")
	
	var age_number1 = parseInt(ver1_data[1])
	var age_number2 = parseInt(ver2_data[1])
	if (age_number1 > age_number2) return false
	if (age_number1 < age_number2) return true
	
	var stage_number1 = parseInt(ver1_data[2])
	var stage_number2 = parseInt(ver2_data[2])
	if (stage_number1 > stage_number2) return false
	if (stage_number1 < stage_number2) return true
	
	var minor_number1 = parseInt(ver1_data[3])
	var minor_number2 = parseInt(ver2_data[3])
	if (minor_number1 >= minor_number2) return false
	if (minor_number1 < minor_number2) return true
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
	game = get_default_player()
	save_game()
	start_interval()
}