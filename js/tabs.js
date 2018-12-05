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
	if (id == "options") {
		document.getElementById("tick_rate").textContent = "Tick rate: " + game.options.tick_rate + "/s"
		document.getElementById("theme").textContent = "Theme: " + game.options.theme
		document.getElementById("notation").textContent = "Notation: " + game.options.notation
		document.getElementById("exported_save").style.display = "none"
	}
}