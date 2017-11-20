var todo = {};

/**
 * todoを登録する時に使用されます
 * @type {{event: string, listener: todo.rightMenuEntry.listener}}
 */
todo.rightMenuEntry = {
	event:'click',
	listener:function(){
		var id = $$('#memoId').val();

		model.getGist(id).then(function(memo){
			view.clearRightPanel();

			var tasks = memo.etc.todo.tasks;

			//TODO描写
			view.showRightPanel({
				templateName:'todoTemplate',
				templateData:{
					tasks:tasks
				}
			});

			//イベント
			$$('#todoAdd').on('click', function(){
				var template = Template7.templates.todoListElementTemplate({
					name:'',
				});
				$$('#todoList').append(template);
			});
		}).catch(function(){
			console.log('getGist error');
		});
	}
};

todo.createFirstTemplate = {
	todo:{
		tasks:[]
	}
};