// Hunger Graph!  Building shortest path between bands
// Using RequireJS (very poorly I might add), Backbone, jquery, and my face

require(["order!../lib/jquery-1.6.4","order!../lib/underscore","order!../lib/backbone",
		"order!../lib/json2","order!../lib/hashmap","order!../lib/binheap","order!models","order!views"], function(){
		
		$(function(){

			Backbone.sync = function(method, model, success, error){ 
				success();
			}
			var appView = new AppView();
		});
	});