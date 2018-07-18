<?php
require_once __DIR__ . '/../../vendor/autoload.php';
use Google\Cloud\Language\LanguageClient;

class Gcnl{
	static $JS_ENABLE;
	const INFO = [
		"NAME"=>"Gcnlプラグイン",
		"VERSION"=>1.00,
		"DESCRIPTION"=>"記事データの解析",
		"AUTHOR"=>"SoraKumo",
		"TABLES"=>[]
	];
	public static function initModule(){
		MG::DB()->exec(
			"create table IF NOT EXISTS gcnl_sentiment(
				qiita_item_id text primary key references qiita_item(qiita_item_id),value text);
			create table IF NOT EXISTS gcnl_params(name text primary key,value text);
			create table IF NOT EXISTS gcnl_analyzed(qiita_item_id text references qiita_item(qiita_item_id),
				analyz_type text,score double,primary key(qiita_item_id,analyz_type))");

	}
	public static function JS_analyze($id){
		//解析済みデータを取得
		$value = Self::getAnalyze($id);
		if($value !== null){
			return ["id"=>$id,"value"=>json_decode($value['value'])];
		}
		$key = Self::getKey();
		if($key === null)
			return null;

		//Qiitaの記事を取得
		$value = QiitaData::getItem($id);

		# Instantiates a client
		try{
			$language = new LanguageClient(['keyFile' => $key]);
			$sentiment = $language->analyzeSentiment($value['body']);
			MG::DB()->exec("insert into gcnl_sentiment values(?,?)",$id,json_encode($sentiment->info()));
			return ["id"=>$id,"value"=>$sentiment->info()];
		}catch(Exception $e){
			return null;
		}
	}
	public static function JS_analyze2($id){
		$value = Self::getAnalyze($id);
		if($value === null)
			return false;
		$value = json_decode($value['value'],true);
		$scores1 = [];
		$scores2 = [];
		foreach($value['sentences'] as $sentence){
			$score = $sentence["sentiment"]["score"];
			if($score != 0){
				$scores1[] = $score;
				$scores2[] = abs($score);
			}
		}
		$count = count($scores1);
		if($count < 20)
			return null;
		$count2 = (int)($count*2/3);
		rsort($scores1);
		rsort($scores2);
		$a = 0;
		$p = 0;
		$m = 0;
		for($i=0;$i<$count2;$i++){
			$a += $scores2[$i];
			$p += $scores1[$i];
			$m += $scores1[$count-$i-1];
		}
		$a /= $count2;
		$p /= $count2;
		$m /= $count2;
		MG::DB()->exec("insert into gcnl_analyzed values(?,'ABS',?)",$id,$a);
		MG::DB()->exec("insert into gcnl_analyzed values(?,'PLUS',?)",$id,$p);
		MG::DB()->exec("insert into gcnl_analyzed values(?,'MINUS',?)",$id,$m);
		return [$a,$p,$m];

	}
	public static function getAnalyze($id){
		return MG::DB()->gets("select qiita_item_id as id,value from gcnl_sentiment where qiita_item_id=?",$id);
	}
	public static function JS_setKey($keyData){
		MG::DB()->exec(
			"insert into gcnl_params values('KEY',?) ON CONFLICT ON CONSTRAINT gcnl_params_pkey
				DO UPDATE SET value=?",$keyData,$keyData);
	}
	public static function getKey(){
		$value = MG::DB()->get("select value from gcnl_params where name='KEY'");
		if($value === null)
			return null;
		return json_decode($value,true);
	}
	public static function JS_getKeyProject(){
		$obj = Self::getKey();
		if($obj === null)
			return null;
		return $obj["project_id"];
	}
}
