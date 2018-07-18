<?php

function getJson($url,$params=null,$token=null){
	//パラメータの処理
	if($params !== null){
		$url .= '?';
		foreach($params as $name => $value){
			$url .= sprintf("%s=%s&",urlencode($name),urlencode($value));
		}
		if(substr($url,-1) === '&')
			$url = substr($url, 0, -1);
	}

	//Webサーバからデータの取得
	$conn = curl_init($url);
	curl_setopt($conn, CURLOPT_SSL_VERIFYPEER, true);
	curl_setopt($conn, CURLOPT_SSL_VERIFYHOST, 2);
	curl_setopt($conn, CURLOPT_RETURNTRANSFER, true);
	if($token !== null){
		$headers = array(
			"Authorization: Bearer ".$token);
		curl_setopt($conn, CURLOPT_HTTPHEADER, $headers);
	}
	$response = curl_exec($conn);
	curl_close($conn);
	if($response === false)
		return null;
	return json_decode($response,true);
}

class QiitaData{
	const INFO = [
		"NAME"=>"Qiita用プラグイン",
		"VERSION"=>1.00,
		"DESCRIPTION"=>"Qiitaのデータ管理を行う",
		"AUTHOR"=>"SoraKumo",
		"TABLES"=>[["session",0,1],["users",0,1]]
	];

	static $JS_ENABLE;
	static $mSessionValues;
	public static function initModule(){
		MG::DB()->exec(
			"create table IF NOT EXISTS qiita_user(
				qiita_user_id text primary key,user_name text,image_url text,website_url text,
				items integer,followees integer,followers integer);
			create table IF NOT EXISTS qiita_item(
				qiita_item_id text primary key,qiita_user_id text references qiita_user(qiita_user_id),
				create_at timestamp ,update_at timestamp ,
				title text, body text,rbody text,likes integer,comments integer);
			create index IF NOT EXISTS qiita_item_create_at_idx on qiita_item(create_at);
			create index IF NOT EXISTS qiita_item_update_at_idx on qiita_item(update_at);
			create table IF NOT EXISTS qiita_tag(
				qiita_tag_id serial primary key,tag_name text unique);
			create table IF NOT EXISTS qiita_item_tag(
				qiita_item_id text references qiita_item(qiita_item_id),
				qiita_tag_id integer references qiita_tag(qiita_tag_id),
				primary key(qiita_item_id,qiita_tag_id))");

	}
	public static function JS_getQiitaTitles(){
		return MG::DB()->queryData(
			"select qiita_item_id as id,title,create_at,likes ,comments,not value isnull as analyze,score_abs,score_plus,score_minus from qiita_item
				natural left join gcnl_sentiment
				natural left join (select qiita_item_id,score as score_abs from gcnl_analyzed where analyz_type='ABS') a
				natural left join (select qiita_item_id,score as score_plus from gcnl_analyzed where analyz_type='PLUS') b
				natural left join (select qiita_item_id,score as score_minus from gcnl_analyzed where analyz_type='MINUS') c
				order by create_at desc	");
	}
	public static function JS_getQiitaItem($id){
		return MG::DB()->gets("select * from qiita_item where qiita_item_id=?",$id);
	}
	public static function JS_recvQiitaItems(){
		if(!MG::isAdmin())
			return false;

		$params = [];
		$params['per_page'] = 100;

		MG::DB()->exec('begin');
		for($i=0;$i<10;$i++){
			$params['page'] = $i+1;
			$items = getJson("https://qiita.com/api/v2/items",$params);
			if($items === null)
				return false;
			foreach($items as $item){
				Self::insertUser($item['user']);
				Self::insertItem($item);
				Self::insertTag($item);
			}
		}
		MG::DB()->exec('commit');
		return true;
	}
	public static function JS_getQiitaItemsInfo(){
		return MG::DB()->gets("select count(*) as count,min(create_at) as first_at,max(create_at) as last_at from qiita_item");
	}
	public static function insertTag($item){
		$tags = $item['tags'];
		if(count($tags) === 0)
			return;
		$name = [];
		foreach($tags as $tag){
			MG::DB()->exec("insert into qiita_tag values(default,?)	ON CONFLICT DO NOTHING",
				$tag['name']);
			$name[] = $tag['name'];
		}
		$params = MG::DB()->createValueParam($name);
		MG::DB()->exec(
			"insert into qiita_item_tag
				select ?,qiita_tag_id from qiita_tag where tag_name in ($params) ON CONFLICT DO NOTHING",
				$item['id']);
	}

	public static function insertItem($item){
		MG::DB()->exec("insert into qiita_item values(?,?,?,?,?,?,?,?,?)
			ON CONFLICT ON CONSTRAINT qiita_item_pkey
			DO update set update_at=?,title=?,body=?,rbody=?,likes=?,comments=?",
			$item['id'],
			$item['user']['permanent_id'],
			$item['created_at'],
			$item['updated_at'],
			$item['title'],
			$item['body'],
			$item['rendered_body'],
			$item['likes_count'],
			$item['comments_count'],

			$item['updated_at'],
			$item['title'],
			$item['body'],
			$item['rendered_body'],
			$item['likes_count'],
			$item['comments_count']);
		return $item['id'];
	}
	public static function insertUser($user){
		MG::DB()->exec("insert into qiita_user values(?,?,?,?,?,?,?)
			ON CONFLICT ON CONSTRAINT qiita_user_pkey
			DO update set user_name=?,image_url=?,website_url=?,
				items=?,followees=?,followers=?",
			$user['permanent_id'],
			$user['name'],
			$user['profile_image_url'],
			$user['website_url'],
			$user['items_count'],
			$user['followees_count'],
			$user['followers_count'],

			$user['name'],
			$user['profile_image_url'],
			$user['website_url'],
			$user['items_count'],
			$user['followees_count'],
			$user['followers_count']);
		return $user['permanent_id'];
	}
	public static function getItem($id){
		return MG::DB()->gets("select * from qiita_item where qiita_item_id=?",$id);
	}
}