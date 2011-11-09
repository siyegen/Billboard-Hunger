/* Models and Collections
*  These are our models, they hold the data for
*  what's going on, and in a real system would come
*  from the 'backend', and would be manipulated and
*  saved back to whatever persistance layer we'd use
*/

// Simple collection of bands
var BandList = Backbone.Collection.extend({
	model: Band
});

// Node state, used for readability
var NodeState = {
	blank: 'default',
	start: 'success',
	end: 'important',
	selected: 'notice'
};

// A Band object is our node object
// if we think about this as a graph
// There are a lot of helper methods here to be used if we
// were to make this app more robust
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
		// Some sanity checks for changing the state of our model
		// if we aren't changing states (last and new are the same)
		// then we don't want to set states again.
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
		// Method to help clear up attributes when
		// reusing the band for multiple runs
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
		// We mostly only care if the node/band is 'blank'
		// or some value that actually means something, so this
		// is just a helper/readability method to that end
		if (this.get('state') === NodeState.blank){
			return true;
		} else {
			return false;
		}
	}
});
