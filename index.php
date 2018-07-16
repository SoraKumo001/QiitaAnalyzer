<?php
require_once("PHP/Manager.php");


function outputFile($fileName){
	// Last-modified と ETag 生成
	$last_modified = gmdate( "D, d M Y H:i:s T", filemtime($fileName) );
	$etag = md5( $last_modified.$fileName);
	// ヘッダ送信
	header( "Last-Modified: {$last_modified}" );
	header( "Etag: {$etag}" );
	readfile($fileName);
}

$result = MG::init();
if($result === null){
	outputFile(".index.html");
}
else{
	//Log::output(MG::getSessionHash(),$result["message"]);
	ob_start("ob_gzhandler");
	header("Access-Control-Allow-Origin: *");
	echo json_encode($result);
}
