var tabName = "upgrades"
function switchTab(id) {
	if (id == tabName) return
	document.getElementById("tab_" + tabName).style.display = "none"
	document.getElementById("tab_" + id).style.display = "block"
	tabName = id
}