var todo = {};

/**
 * todoを登録する時に使用されます
 * @type {{event: string, listener: todo.rightMenuEntry.listener}}
 */
todo.rightMenuEntry = {
	event:'click',
	listener:function(){
		var localTodo = localforage.createInstance({
			name:"todo"
		});

		var id = $$('#memoId').val();

		view.clearRightPanel();

		localTodo.getItem(id).then(function(tasks){
			//TODO描写
			view.showRightPanel({
				templateName:'todoTemplate',
				templateData:{
					tasks:tasks,
				}
			});

			//メニュー登録イベント
			$$('#todoAdd').on('click', function(){
				var template = Template7.templates.todoListElementTemplate({
					name:'',
				});
				$$('#todoList').append(template);
			});
		}).catch(function(){
			//TODO描写
			view.showRightPanel({
				templateName:'todoTemplate',
				templateData:{
					tasks:[],
				}
			});

			//メニュー登録イベント
			$$('#todoAdd').on('click', function(){
				var template = Template7.templates.todoListElementTemplate({
					name:'',
				});
				$$('#todoList').append(template);
			});
		});


		//右パネルを閉じる時にTODOを保存する
		$$('.panel-right').on('panel:close', function(){
			var todo = [];
			$$('.todoListBox', this).each(function(){
				var task = {
					name: $$('[name=todoListTaskName]', this).val(),
					checked: $$('[name=todoListChecked]:checked', this).val() === 'on',
				}

				todo.push(task);
			});

			localTodo.setItem(id, todo);
		});
	}
};