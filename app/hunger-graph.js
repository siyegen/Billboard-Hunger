// Hunger Graph!  Building shortest path between bands
// Using RequireJS (very poorly I might add), Backbone, jquery, and my face

require([
	"order!../lib/jquery-1.6.4","order!../lib/underscore","order!../lib/backbone",
	"order!../lib/json2","order!../lib/hashmap","order!../lib/binheap",
	"order!models","order!views","order!../lib/raphael-min"
	], function(){
		
	$(function(){

		// Since there is no backend to interface with, and I'm not using local storage
		// I'm overriding the sync function of Backbone so 'destroy' and other methods
		// can be used without throwing any errors
		Backbone.sync = function(method, model, success, error){ 
			success();
		}
		// Starting up the main view, which kicks everything off
		var appView = new AppView();
	});
});