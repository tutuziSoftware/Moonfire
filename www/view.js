var view = {};

view.showMemoList = function(texts){
	texts.forEach(function(text){
		var memo = Template7.templates.memoTemplate(text);

		$$('#memoList').append(memo);
	});
};

view.clearMemoList = function(){
	$$('#memoList').empty();
};

/**
 * 左パネルにメモ一覧を表示します
 */
view.showLeftMemoList = function(memos){
	memos.forEach(function(memo){
		var leftMemoListTemplate = Template7.templates.leftMemoListTemplate(memo);
		$$('#leftMemoList').append(leftMemoListTemplate);
	});
};

/**
 * エディタの1行目を必ず<div>で覆う為の関数です。
 *
 * memo: 適切な関数名が思いつかなかった……。あとこれはviewがやることなのか？
 */
view.htmlTitle = function(){
	var title = $$('#editor').html().match(/[^<]*/);
	if(title[0] !== ''){
		$$('#editor').html('<div>'+title[0]+'</div>');
	}
};