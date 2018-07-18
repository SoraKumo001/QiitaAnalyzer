(function(){
//PHP通信用アダプタの作成(グローバル)
ADP = AFL.createAdapter("./",sessionStorage.getItem("sessionHash"));
document.addEventListener("DOMContentLoaded",onLoad);

//プログラム開始動作
function onLoad(){
	//認証処理後、onStartを呼び出す
	SESSION.requestSession(onStart,false);
}
System = {};
function onStart(r){
	GUI.rootWindow.removeChildAll();

	//画面上部を作成
	var top = GUI.createWindow();
	top.setSize(0, 60);
	top.setChildStyle("top");
	top.setClientClass("LayoutTop");

	var title = document.createElement("div");
	top.getClient().appendChild(title);
	title.textContent = "Qiita記事解析システム";

	var login = document.createElement("div");
	System.login = login;
	login.className = "menuItem";
	top.getClient().appendChild(login);
	login.addEventListener("click", function () {
		SESSION.createLoginWindow(onStart);
	});

	//画面分割(横)
	var separate = GUI.createSeparate(200,"we");
	separate.setChildStyle("client");

	//ツリーメニューの作成
	var treeMenu = GUI.createTreeView();
	separate.addSeparateChild(0, treeMenu,"client");
	treeMenu.addEvent("select",function(){
		var parent = separate.getChild(1);
		parent.removeChildAll();
		var proc = treeMenu.getSelectValue();
		if(proc){
			var w = proc();
			separate.addSeparateChild(1,w,"client");
		}

	});

	var rootItem = treeMenu.getRootItem();
	rootItem.setItemText("Menu一覧");

	var item,subItem;
	item = rootItem.addItem("システム");
	item.addItem("モジュール確認").setItemValue(createPluginView);
	item.addItem("データベース設定").setItemValue(createDatabaseView);
	item.addItem("ユーザ設定").setItemValue(createUserView);
	item.addItem("グループ設定").setItemValue(createGroupView);
	item.addItem("ログ").setItemValue(createLog);


	item = rootItem.addItem("Qiitaデータ関連");
	item.addItem("データ取得").setItemValue(createQiitaView);
	item.addItem("データ確認").setItemValue(createQiitaTitleView);

	item = rootItem.addItem("Google CNL");
	item.addItem("設定").setItemValue(createGcnlView);


	System.login.textContent = r.user.name;


}
})();