var tab_name
function switch_tab(id) {
	if (tab_name == undefined) return
	if (id == tab_name) return
	document.getElementById("tab_" + tab_name).style.display = "none"
	document.getElementById("tab_" + id).style.display = "block"
	tab_name = id
	update_tab_on_switch(id)
}

function update_tab_on_switch(id) {
	if (id == "upgrades") for (var upg=1; upg<4; upg++) update_upgrade(upg)
	if (id == "files") {
		if (game.files.unlocked) {
			document.getElementById("tab_locked_files").style.display = "none"
			document.getElementById("tab_unlocked_files").style.display = "block"
			for (var file=1; file<9; file++) update_file(file)
			document.getElementById("total_file_boost").innerHTML = "<b>Total multiplier on bit and byte productions</b>: " + format(get_total_file_boost(), 1) + "x"
		} else {
			document.getElementById("tab_locked_files").style.display = "block"
			document.getElementById("tab_unlocked_files").style.display = "none"
		}
	}
	if (id == "computers") {
		if (game.computers.unlocked) {
			document.getElementById("tab_locked_computers").style.display = "none"
			document.getElementById("tab_unlocked_computers").style.display = "block"
			document.getElementById("file_selected").textContent = "File selected: " + (game.computers.file_selected ? "#" + game.computers.file_selected : "None")
			for (var file=1; file<9; file++) document.getElementById("select_file_" + file).innerHTML = "File #" + file + "<br>" + format(game.files[file]) + " bits"
			for (var comp=1; comp<5; comp++) update_computer(comp)
			document.getElementById("total_computer_boost").innerHTML = "<b>Total multiplier discount on upgrades 1 and 3</b>: " + format(get_total_computer_boost(), 1) + "x"
		} else {
			document.getElementById("tab_locked_computers").style.display = "block"
			document.getElementById("tab_unlocked_computers").style.display = "none"
			document.getElementById("total_file_boost_computers").innerHTML = "<b>Total multiplier on bit and byte productions</b>: " + format(get_total_file_boost(), 1) + "x"
		}
	}
	if (id == "statistics") {
		document.getElementById("total_upgrades").textContent = game.statistics.total_upgrades
		if (game.files.unlocked) {
			document.getElementById("bits_injected_row").style.display = ""
			document.getElementById("bits_injected").textContent = format(game.statistics.bits_injected)
		} else document.getElementById("bits_injected_row").style.display = "none"
		if (game.computers.unlocked) {
			document.getElementById("files_dissolved_row").style.display = ""
			document.getElementById("total_exp_row").style.display = ""
			document.getElementById("total_levelups_row").style.display = ""
			document.getElementById("files_dissolved").textContent = game.statistics.files_dissolved
			document.getElementById("total_exp").textContent = game.statistics.total_exp
			document.getElementById("total_levelups").textContent = game.statistics.total_levelups
		} else {
			document.getElementById("files_dissolved_row").style.display = "none"
			document.getElementById("total_exp_row").style.display = "none"
			document.getElementById("total_levelups_row").style.display = "none"
		}
	}
	if (id == "options") {
		document.getElementById("tick_rate").textContent = "Tick rate: " + game.options.tick_rate + "/s"
		document.getElementById("theme").textContent = "Theme: " + get_theme_name()
		document.getElementById("theme_menu").style.display = "none"
		document.getElementById("notation").textContent = "Notation: " + game.options.notation
		document.getElementById("exported_save").style.display = "none"
	}
}

function update_tab_buttons() {
	document.getElementById("tab_button_computers").style.display = game.files.unlocked ? "" : "none"
}

function open_theme_menu() {
	if (document.getElementById("theme_menu").style.display == "none") {
		document.getElementById("theme_menu").style.display = ""
		document.getElementById("theme_color").textContent = "Color: " + ([null, "Red", "Orange", "Yellow", "Lime", "Green", "Jade", "Cyan", "Water", "Blue", "Purple", "Pink", "Red Beryl"])[game.options.theme.color]
		document.getElementById("theme_light").textContent = "Light: " + (game.options.theme.light ? "ON" :  "OFF")
		document.getElementById("theme_dark").textContent = "Dark: " + (game.options.theme.dark ? "ON" :  "OFF")
	} else document.getElementById("theme_menu").style.display = "none"
}