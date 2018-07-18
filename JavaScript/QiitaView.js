function createQiitaView(){
	var win = GUI.createWindow();
	var client = win.getClient();

	var clientArea = document.createElement('div');
	clientArea.classList.add("QiitaInfoView");
	client.appendChild(clientArea);

	var infoArea = document.createElement('div');
	clientArea.appendChild(infoArea);
	infoArea.classList.add("BoxView");

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
function createAnalyzOutput(list){
	var win = GUI.createFrameWindow();
	win.setPos();
	var client = win.getClient();

	var parent = document.createElement('div');
	parent.style.overflow='auto';
	parent.style.height = '100%';
	client.appendChild(parent);

	for (var i= 0;i< list.getItemCount();i++){
		var div = document.createElement("div");
		div.textContent = AFL.sprintf("[%02d]　%s　%s　%s　[%s](%s)",i+1,
			list.getItemText(i, 2), list.getItemText(i, 3), list.getItemText(i, 4),
			list.getItemText(i, 7), "https://qiita.com/old-stone/items/" + list.getItemValue(i));
		parent.appendChild(div);
	}
	return win;
}

function createQiitaTitleView(){
	var mActive = true;
	var mIndex = 0;
	function startAnalyze(){
		while (mIndex < list.getItemCount()) {
			if(list.getItemText(mIndex,2) == ""){
				var id = list.getItemValue(mIndex);
				ADP.exec("Gcnl.analyze", id).on = function (value){
					if(value !== null){
						list.setItem(mIndex, 1,'●');
						if (mActive){
							mIndex++;
							startAnalyze();
						}
					}else{
						list.setItem(mIndex, 1, '×');
						if (mActive){
							mIndex++;
							startAnalyze();
						}
						//GUI.createMessageBox("エラー", "解析失敗", ["OK"]);
					}
				}
				break;
			}
			mIndex++;
		}
	}
	function startAnalyze2() {
		while (mIndex < list.getItemCount()) {
			if (list.getItemText(mIndex, 2) == "") {
				var id = list.getItemValue(mIndex);
				ADP.exec("Gcnl.analyze", id).on = function (value) {
					if (value !== null) {
						list.setItem(mIndex, 1, '●');
						list.setItem(mIndex, 2, value[0] == null ? '' : value[0].toFixed(3));
						list.setItem(mIndex, 3, value[1] == null ? '' : value[1].toFixed(3));
						list.setItem(mIndex, 4, value[2] == null ? '' : value[2].toFixed(3));
						if (mActive) {
							mIndex++;
							startAnalyze2();
						}
					} else {
						list.setItem(mIndex, 1, '×');
						if (mActive) {
							mIndex++;
							startAnalyze2();
						}
						//GUI.createMessageBox("エラー", "解析失敗", ["OK"]);
					}
				}
				break;
			}
			mIndex++;
		}
	}
	function stopAnalyze() {
		mActive = false;
	}

	var win = GUI.createWindow();

	var panel = GUI.createPanel();
	win.addChild(panel, 'top');

	panel.getClient().innerHTML =
		"<button>記事解析</button><button>記事分析</button><button>解析停止</button> <button>Qiita用結果出力</button><button>分析内容</button>";
	var buttons = panel.getClient().querySelectorAll("button");
	buttons[0].addEventListener("click", function () {mIndex=0;mActive=true;startAnalyze();});
	buttons[1].addEventListener("click", function () {mIndex=0;mActive=true;startAnalyze2();});
	buttons[2].addEventListener("click", stopAnalyze);
	buttons[3].addEventListener("click", function () {createAnalyzOutput(list);});
	buttons[4].addEventListener("click", function () { createAnalyzView(list.getItemValue(list.getSelectIndex())); });
	var list = GUI.createListView();
	win.addChild(list,"client");
	list.addHeader('日時',220);
	list.addHeader('解析', 60);
	list.addHeader('感情', 60);
	list.addHeader('＋', 60);
	list.addHeader('－', 60);
	list.addHeader('コメント',80);
	list.addHeader('イイネ',80);
	list.addHeader('タイトル', 800);
	list.setColumnType(2,1);
	list.setColumnType(3,1);
	list.setColumnType(4, 1);
	list.setColumnType(5, 1);
	list.setColumnType(6, 1);
	win.loadTitles = function(){
		ADP.exec("QiitaData.getQiitaTitles").on = function (values) {
			list.clearItem();
			if(values === null)
				return;
			for(var i=0;i<values.length;i++){
				var value = values[i];
				var index = list.addItem(value['create_at']);
				list.setItem(index, 1, value['analyze']?"●":"");
				list.setItem(index, 2, value['score_abs']==null?'':parseFloat(value['score_abs']).toFixed(3));
				list.setItem(index, 3, value['score_plus'] == null ?'':parseFloat(value['score_plus']).toFixed(3));
				list.setItem(index, 4, value['score_minus'] == null ?'':parseFloat(value['score_minus']).toFixed(3));
				list.setItem(index, 5, value['comments']);
				list.setItem(index, 6, value['likes']);
				list.setItem(index, 7, value['title']);
				list.setItemValue(index, value['id']);
			}
		}
	}
	list.addEvent("itemDblClick",function(e){
		var id = list.getItemValue(e.itemIndex);
		createQiitaItemView(id);
		//createAnalyzView(id);
	});
	win.loadTitles();
	return win;
}
function createAnalyzView(id) {
	var win = GUI.createFrameWindow();
	win.setTitle("解析結果");
	win.setSize(900, 800);
	win.setPos();
	var client = win.getClient();

	ADP.exec("Gcnl.analyze", id).on = function (value) {
		var pre = document.createElement('pre');
		pre.style.whiteSpace = 'pre-wrap';
		pre.style.height='100%';
		pre.style.overflow='auto';
		pre.textContent = JSON.stringify(value['value'],null,' ');
		client.appendChild(pre);
	}
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