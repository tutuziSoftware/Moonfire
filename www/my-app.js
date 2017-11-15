// Initialize your app
var myApp = new Framework7();

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = myApp.addView('.view-main', {
	// Because we use fixed-through navbar we can enable dynamic navbar
	dynamicNavbar: true
});


myApp.onPageInit('editor', function (page) {
	//データ保存
	$$('#save').on('click', function () {
		saveGist('test', $$('#editor').html());
	});

	//データ取得
	getGist('test').then(function(text){
		$$('#editor').html(text);
	});
});