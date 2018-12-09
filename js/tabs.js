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
			document.getElementById("percentage_to_be_injected").innerHTML = "<b>Percentage of data to be injected</b>: " + (Math.round(game.files.percentage * 10) / 10) + "%"
			for (var file=1; file<9; file++) {
				update_file(file)
				document.getElementById("file_" + file + "_button").textContent = "Inject" + (game.statistics.times_transfer > 0 ? " bits" : "")
				document.getElementById("inject_words_" + file).style.display = game.statistics.times_transfer > 0 ? "" : "none"
			}
			document.getElementById("total_file_boost").innerHTML = "<b>Total multiplier on bit and byte productions</b>: " + format(get_total_file_boost(), 1) + "x"
			document.getElementById("inject_equally_button").style.display = game.statistics.times_transfer > 0 ? "" : "none"
		} else {
			document.getElementById("tab_locked_files").style.display = "block"
			document.getElementById("tab_unlocked_files").style.display = "none"
			document.getElementById("perm_unlock_files").style.display = game.statistics.times_transfer > 0 ? "" : "none"
		}
	}
	if (id == "computers") {
		if (game.computers.unlocked) {
			document.getElementById("tab_locked_computers").style.display = "none"
			document.getElementById("tab_unlocked_computers").style.display = "block"
			document.getElementById("file_selected").innerHTML = "<b>File selected</b>: " + (game.computers.file_selected ? "#" + game.computers.file_selected : "None")
			for (var file=1; file<9; file++) update_select_file_button(file)
			for (var comp=1; comp<5; comp++) update_computer(comp)
			document.getElementById("total_computer_boost").innerHTML = "<b>Total multiplier discount on upgrades 1 and 3</b>: " + format(get_total_computer_boost(), 1) + "x"
			document.getElementById("unlock_servers").style.display = game.computers.servers_unlocked || game.statistics.times_transfer == 0 ? "none" : ""
		} else {
			document.getElementById("tab_locked_computers").style.display = "block"
			document.getElementById("tab_unlocked_computers").style.display = "none"
			document.getElementById("total_file_boost_computers").innerHTML = "<b>Total multiplier on bit and byte productions</b>: " + format(get_total_file_boost(), 1) + "x"
			document.getElementById("perm_unlock_computers").style.display = game.statistics.times_transfer > 0 ? "" : "none"
		}
	}
	if (id == "transfer") {
		var total = 0
		if (game.computers.unlocked) for (var comp=1; comp<5; comp++) total += game.computers[comp].level
		document.getElementById("total_computer_levels").innerHTML = "<b>Total computer levels</b>: " + total
		if (game.statistics.times_transfer > 0) update_autobuyers()
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
			document.getElementById("total_exp").textContent = format(game.statistics.total_exp)
			document.getElementById("total_levelups").textContent = game.statistics.total_levelups
		} else {
			document.getElementById("files_dissolved_row").style.display = "none"
			document.getElementById("total_exp_row").style.display = "none"
			document.getElementById("total_levelups_row").style.display = "none"
		}
		if (game.statistics.times_transfer > 0) {
			document.getElementById("times_transfer_row").style.display = ""
			document.getElementById("time_this_transfer_row").style.display = ""
			document.getElementById("fastest_transfer_row").style.display = ""
			document.getElementById("total_words_row").style.display = ""
			document.getElementById("words_injected_row").style.display = ""
			document.getElementById("times_transfer").textContent = game.statistics.times_transfer
			document.getElementById("fastest_transfer").textContent = format_time(game.statistics.fastest_transfer)
			document.getElementById("total_words").textContent = format(game.statistics.total_words)
			document.getElementById("words_injected").textContent = format(game.statistics.words_injected)
		} else {
			document.getElementById("times_transfer_row").style.display = "none"
			document.getElementById("time_this_transfer_row").style.display = "none"
			document.getElementById("fastest_transfer_row").style.display = "none"
			document.getElementById("total_words_row").style.display = "none"
			document.getElementById("words_injected_row").style.display = "none"
		}
		if (game.computers.servers_unlocked) {
			document.getElementById("total_sxp_row").style.display = ""
			document.getElementById("servers_made_row").style.display = ""
			document.getElementById("total_sxp").textContent = format(game.statistics.total_sxp)
			document.getElementById("servers_made").textContent = format(game.statistics.servers_made)
		} else {
			document.getElementById("total_sxp_row").style.display = "none"
			document.getElementById("servers_made_row").style.display = "none"
		}
	}
	if (id == "feats") {
		game.feats.notifications = 0
		document.getElementById("tab_button_feats").textContent = "Feats"
		for (var feat=1; feat<feat_descs.length; feat++) document.getElementById("feat_" + feat).textContent = game.feats.achieved.includes(feat) ? "Completed" : "Not completed"
	}
	if (id == "options") {
		document.getElementById("auto_save").textContent = "Auto save: " + (game.options.auto_save ? "ON" : "OFF")
		document.getElementById("offline_progress").textContent = "Offline progress: " + (game.options.offline_progress ? "ON" : "OFF")
		document.getElementById("tick_rate").textContent = "Tick rate: " + game.options.tick_rate + "/s"
		document.getElementById("theme").textContent = "Theme: " + get_theme_name()
		document.getElementById("theme_menu").style.display = "none"
		document.getElementById("notation").textContent = "Notation: " + game.options.notation
		document.getElementById("lock_bits_production").textContent = "Locked bits production: " + (game.options.locked_bits_production ? "ON" : "OFF")
		document.getElementById("exported_save").style.display = "none"
	}
}

function update_tab_buttons() {
	document.getElementById("tab_button_computers").style.display = game.files.unlocked || game.statistics.times_transfer > 0 ? "" : "none"
	document.getElementById("tab_button_transfer").style.display = game.computers.unlocked || game.statistics.times_transfer > 0 ? "" : "none"
	document.getElementById("tab_button_feats").style.display = game.computers.servers_unlocked ? "" : "none"
	document.getElementById("tab_button_feats").textContent = "Feats" + (game.feats.notifications > 0 ? " (" + game.feats.notifications + ")" : "")
}

function open_theme_menu() {
	if (document.getElementById("theme_menu").style.display == "none") {
		document.getElementById("theme_menu").style.display = ""
		document.getElementById("theme_color").textContent = "Color: " + ([null, "Red", "Orange", "Yellow", "Lime", "Green", "Jade", "Cyan", "Water", "Blue", "Purple", "Pink", "Red Beryl"])[game.options.theme.color]
		document.getElementById("theme_light").textContent = "Light: " + (game.options.theme.light ? "ON" :  "OFF")
		document.getElementById("theme_dark").textContent = "Dark: " + (game.options.theme.dark ? "ON" :  "OFF")
	} else document.getElementById("theme_menu").style.display = "none"
}