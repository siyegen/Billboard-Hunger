// Models and collections

var BandList = Backbone.Collection.extend({
	model: Band
});

// A Band object is our node object
// if we think about this as a graph
var Band = Backbone.Model.extend ({
	defaults: {
		cost: Infinity,
		visited: false,
		parent: null
	},
	initialize: function(){

		// Holds our list of connected bands
		this.collection = new BandList();
		
	},
	function: addBand(band){
		
	},
	function: addBands(listBands){
		
	}

});