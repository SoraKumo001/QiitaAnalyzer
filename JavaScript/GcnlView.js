function createChild(parent,tagName,params){
	var node = document.createElement(tagName);
	parent.appendChild(node);
	if(params != null){
		for (var index in params) {
			node[index] = params[index];
		}
	}

	return node;
}
function createGcnlView(){
	var win = GUI.createWindow();
	var client = win.getClient();

	client.addEventListener("drop", function (e) {
		e.preventDefault();
		var reader = new FileReader();
		reader.readAsText(e.dataTransfer.files[0]);
		reader.onload = function (evt){
			ADP.exec("Gcnl.setKey", evt.target.result).on = function(){
				win.loadKeyStat();
			}
		}
	});
	client.addEventListener("dragover", function (e) {
		e.preventDefault();
	});

	var groupView = createChild(client, 'div', { 'className':"GroupView"});
	var line = createChild(groupView, "div");
	line.textContent = "キーファイルをドラッグドロップ";

	var groupArea = createChild(groupView, "div", { 'className': "BoxView" });

	var box = createChild(groupArea, "div");
	line = createChild(box, "div");
	var name;
	name = createChild(line, "div");
	name.textContent = "キーファイル";
	name = createChild(line, "div");
	name.textContent = "プロジェクトID";


	line = createChild(box, "div");
	var value1 = createChild(line, "div");
	value1.textContent = "";
	var value2 = createChild(line, "div");
	value2.textContent = "";

	win.loadKeyStat = function(){
		ADP.exec("Gcnl.getKeyProject").on = function (value) {
			if(value == null){
				value1.textContent = "設定されていません";
				value2.textContent = "設定されていません";
			}
			else{
				value1.textContent = "転送済み";
				value2.textContent = value;
			}
		}
	}
	win.loadKeyStat();
	return win;
}