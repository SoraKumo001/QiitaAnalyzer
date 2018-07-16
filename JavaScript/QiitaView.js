function createQiitaView(){
	var win = GUI.createWindow();
	var client = win.getClient();

	var clientArea = document.createElement('div');
	clientArea.classList.add("QiitaInfoView");
	client.appendChild(clientArea);

	var infoArea = document.createElement('div');
	clientArea.appendChild(infoArea);
	infoArea.classList.add("Plugins");

	var div = document.createElement('div');
	infoArea.appendChild(div);

	var p = ["記事数","最古日時","最新日時"];
	var names = document.createElement('div');
	div.appendChild(names);
	var infoValues = document.createElement('div');
	div.appendChild(infoValues);
	for (var j = 0; j < p.length; j++) {
		var n = document.createElement('div');
		names.appendChild(n);
		n.textContent = p[j];
	}

	win.getQiitaItemInfo = function(){
		ADP.exec("QiitaData.getQiitaItemsInfo").on = function(value){
			while (infoValues.childNodes.length) infoValues.removeChild(infoValues.childNodes[0]);
			var p = [value.count,value.first_at,value.last_at];
			for(var i=0;i<p.length;i++){
				var n = document.createElement('div');
				infoValues.appendChild(n);
				n.textContent = p[i];
			}
		}
	}

	var div = document.createElement('div');
	div.classList.add("ParamsEditView");
	clientArea.appendChild(div);
	var button = document.createElement('button');
	button.classList.add("blueButton");
	div.appendChild(button);
	button.textContent = "読み込み";
	button.addEventListener('click',function(){
		var msg = GUI.createMessageBox("メッセージ","記事データの読み込み");
		ADP.exec("QiitaData.recvQiitaItems").on = function(flag){
			msg.close();
			if(flag)
				win.getQiitaItemInfo();
			else
				GUI.createMessageBox("エラー", "記事データの読み込み失敗",["OK"]);
		}
	});

	win.getQiitaItemInfo();
	return win;
}

function createQiitaTitleView(){
	var win = GUI.createWindow();
	var list = GUI.createListView();
	win.addChild(list,"client");
	list.addHeader('日時',240);
	list.addHeader('コメント数',80);
	list.addHeader('イイネ数',80);
	list.addHeader('タイトル', 800);
	win.loadTitles = function(){
		ADP.exec("QiitaData.getQiitaTitles").on = function (values) {
			list.clearItem();
			if(values === null)
				return;
			for(var i=0;i<values.length;i++){
				var value = values[i];
				var index = list.addItem(value['create_at']);
				list.setItem(index, 1, value['comments']);
				list.setItem(index, 2, value['likes']);
				list.setItem(index, 3, value['title']);
				list.setItemValue(index, value['id']);
			}
		}
	}
	list.addEvent("itemDblClick",function(e){
		var id = list.getItemValue(e.itemIndex);
		createQiitaItemView(id);
	});
	win.loadTitles();
	return win;
}
function createQiitaItemView(id){
	var win = GUI.createFrameWindow();
	win.setTitle("記事内容");
	win.setSize(900,800);
	win.setPos();

	var client = win.getClient();
	var iframe = document.createElement('iframe');
	iframe.style.width = '100%';
	iframe.style.height = '100%';
	client.appendChild(iframe);
	var doc = iframe.contentDocument;

	var link = document.createElement("link");
	link.media = "all";
	link.rel = "stylesheet";
	link.href = "https://cdn.qiita.com/assets/public-0ff749915fc787edd0a35b1c35d9440c.min.css";
	doc.head.appendChild(link);


	ADP.exec("QiitaData.getQiitaItem",id).on = function (value) {
		win.setTitle(value["title"]);
		var html = //qiitaと同じスタイルになるように体裁を設定
			'<div class="p-items_container"><div class="p-items_main"><div class="it-MdContent">' +
			'<h1>' + value["title"] + '</h1>' + value["rbody"] + '</div></div></div>';
		doc.body.innerHTML = html;
	}

	return win;
}