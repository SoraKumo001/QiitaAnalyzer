function createGroupView() {
	var win = GUI.createWindow();

	if(!SESSION.isAuthority('SYSTEM_ADMIN')){
		GUI.createMessageBox("エラー","権限がありません",["OK"]);
		return win;
	}


	var panel = GUI.createPanel();
	win.addChild(panel, "bottom");
	panel.getClient().innerHTML = "<BUTTON>追加</BUTTON><BUTTON>削除</BUTTON>";
	var buttons = panel.getClient().querySelectorAll("button");
	for (var i = 0; i < buttons.length; i++) {
		buttons[i].addEventListener("click", onButtonClick);
	}
	function onButtonClick(e) {
		switch (e.srcElement.textContent) {
			case "追加":
				ADP.exec("Users.addGroup").on = function (r) {
					if (r)
						win.load();
				};
				break;
			case "削除":
				var index = listView.getSelectIndex();
				var id = listView.getItemText(index,0);
				ADP.exec("Users.delGroup", id).on = function (r) {
					if (r)
						win.load();
				};
				break;
		}
	}

	var listView = GUI.createListView();
	listView.addHeader("ID", 80);
	listView.addHeader("ENABLE", 100);
	listView.addHeader("NAME", 150);
	listView.addHeader("INFO", 200);
	listView.addHeader("COUNT", 100);
	win.addChild(listView, "client");

	win.load = function () {
		listView.clearItem();
		ADP.exec("Users.getGroups").on = function (values) {
			if(values === null)
				return;
			for (var i = 0; i < values.length; i++) {
				var value = values[i];
				var index = listView.addItem(value['user_group_id']);
				listView.setItem(index, 1, value['user_group_enable']);
				listView.setItem(index, 2, value['user_group_name']);
				listView.setItem(index, 3, value['user_group_info']);
				listView.setItem(index, 4, 0);
			}
		}
	}

	listView.addEvent("itemClick", function (e) {
		var index = e.itemIndex;
		var subIndex = e.itemSubIndex;
		if (subIndex <= 0)
			return;
		var code = ["user_group_name", "user_group_info"];
		var area = this.getItemArea(index, subIndex);
		var enable = ['true', 'false'];
		switch (subIndex) {
			case 1:
				var select = GUI.createSelectView();
				for (var i in enable)
					select.addText(enable[i]);
				select.setSize(area.width, 200);
				select.setPos(area.x, area.y);
				select.addEvent("select", function (e) {
					var id = listView.getItemText(index, 0);
					ADP.exec("Users.setGroup", id, e.value,null,null).on=function (r) {
						if (r) {
							listView.setItem(index, subIndex, e.value);
						}
					}
				});
				break;
			case 2:
			case 3:
				var edit = GUI.createEditView();
				edit.addEvent("enter", function (e) {
					var v = [];
					v[subIndex - 2] = e.value;
					var id = listView.getItemText(index, 0);
					ADP.exec("Users.setGroup", id, null, v[0], v[1]).on = function (r) {
						if (r) {
							listView.setItem(index, subIndex, e.value);
						}
					}
				});
				edit.setText(this.getItemText(index, subIndex));
				edit.setSize(area.width, area.height);
				edit.setPos(area.x, area.y);
				edit.setOrderSystem(true);
				edit.setFocus();
				break;
		}


	});

	win.load();
	return win;
}