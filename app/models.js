// Models and collections

var BandList = Backbone.Collection.extend({
	model: Band
});

var NodeState = {
	blank: 'default',
	start: 'success',
	end: 'important',
	selected: 'notice'
};

// A Band object is our node object
// if we think about this as a graph
var Band = Backbone.Model.extend({
	defaults: {
		cost: Infinity,
		visited: false,
		parent: null,
		x: 0,
		y: 0,
		state: NodeState.blank,
		prevState: null
	},
	initialize: function(){
		// Holds our list of connected bands
		// that this band is connected to
		this.bandList = new BandList();		
	},
	addBandName: function(bandName){
		var band = new Band({name: bandName});
		this.addBand(band);
	},
	addBand: function(band){
		this.bandList.add(band);		
	},
	addBandsName: function(listBandNames){
		_.each(listBandNames, function(name){
			addBandName(name);
		});
	},
	addBands: function(listBands){
		_.each(listBands, function(band){
			addBand(band);
		});
	},
	clearBands: function(){
		this.bandList.each(function(band){
			band.destroy();
		});
		this.bands = new BandList();
	},
	changeState: function(newState){
		var lastState = this.get('state');
		// toggle start/end off
		var changeState = NodeState.blank;
		if ((lastState === NodeState.start && newState === NodeState.start) ||
			(lastState === NodeState.end && newState === NodeState.end)){
		} else {
			changeState = newState;
		}
		var states = {
			prevState: lastState,
			state: changeState
		};
		this.set(states);
	},
	clearAttr: function(clearState, isSilent){
		var attr = {
			cost: Infinity, parent: null, 
			visited: false
		};
		if (clearState) {
			attr.state = NodeState.blank;
		}
		if (isSilent){
			attr.silent = true;
		}
		this.set(attr);
	},
	stateIsBlank: function(){
		if (this.get('state') === NodeState.blank){
			return true;
		} else {
			return false;
		}
	}
});
