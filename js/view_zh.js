/** @jsx React.DOM */
function language_biome(str){
	var out
	out = CHINESE_TEXT.BIOME_TEXT[str]
	return (out!=undefined ? out : str)
}
function language_instrument(str){
	var out
	out = CHINESE_TEXT.INSTRUMENT_TEXT[str]
	return (out!=undefined ? out : str)
}
function language_location(str){
	var out
	out = CHINESE_TEXT.LOCATION_TEXT[str]
	return (out!=undefined ? out : str)
}

var PlanetBox = React.createClass({displayName: 'PlanetBox',
    render: function(){
        var className = "planet "+this.props.name
        return (
            React.DOM.div( {className:className}, 
            BodyBox( {name:this.props.name} ),
            this.props.children
            )
        )
    }
})

var ScienceBox = React.createClass({displayName: 'ScienceBox',
    render: function(){
        if(this.props.science == undefined){
            return (React.DOM.a( {className:"science nope"}))
        }
        var progress = sciences_by_id[this.props.science.id]
        var scimax = this.props.science.max;
        scimax = Math.round(scimax*100)/100;
        var sciprog = 0;
        var remaining = scimax;
        if(progress!=undefined){
            sciprog = progress.sci;
            if(Math.round(progress.cap*100)/100 != scimax)
            {
                console.log(this.props.science.id + ": " + this.props.science.instrument + "  " + this.props.science.location + ": real " + progress.cap + "!= calc " + scimax)
            }
        }
        remaining -= sciprog;
        remaining = Math.max(remaining, 0) // Make sure it doesn't go negative in case of then having more science then max (from old saves or mods).
        var factor = remaining / scimax;
        var status="normal"
        if(factor < 0.1){
            status="completed"
        }else if(factor < 0.9){
            status="started"
        }

        var remainingDsp = Math.ceil(remaining)
        var alt = language_instrument(this.props.science.instrument) + "  " + language_location(this.props.science.location) + ": " + Math.round(sciprog*100)/100 + "/" + scimax;
        var className = "science "+status
        return (
            React.DOM.a( {className:className, title:alt, id:this.props.science.id}, 
            remainingDsp
            )
        )
    }
})

var BiomeBox = React.createClass({displayName: 'BiomeBox',
    render: function(){
        var component = this
        var sciences =  _.map(RESEARCH_DEPARTMENT.slots, function(slot){
            var science = _.find(component.props.possibleSciences, function(s){
                return s.instrument == slot[1] && s.location == slot[0]
            })
            return (ScienceBox( {science:science}))
        })
        var scimaxall=0;
        var sciprogall=0;
        for (var i=0;i<sciences.length;i++)
        {
            if(sciences[i].props.science == undefined)
            {
                continue;
            }
            var scimax = parseFloat(sciences[i].props.science.max);
            var sciprog = 0;
            var progress = sciences_by_id[sciences[i].props.science.id];
            if(progress!=undefined){
                sciprog = parseFloat(progress.sci);
                sciprogall += sciprog
            }
            if(scimax < sciprog)
            {
                scimaxall += sciprog;
            }else
            {
                scimaxall += scimax;
            }
        }
        var rmall = scimaxall-sciprogall;
        rmall = Math.round(rmall*10)/10;
        return (
            React.DOM.div( {className:"biome"}, 
            React.DOM.progress( {value:sciprogall, max:scimaxall} ),
            React.DOM.div( {className:"sciall"}, rmall),
            React.DOM.div( {className:"biomeHeader", title:this.props.biomeName}, language_biome(this.props.biomeName)),
            sciences
            )
        )
    }
})

var BodyBox = React.createClass({displayName: 'BodyBox',
    getInitialState: function() {
        return {biomes: []};
      },
    reload: function(){
        var component = this
        my_sci = _.filter(RESEARCH_DEPARTMENT.possible_science, function(x){return x.body == component.props.name})
        biomes = _.groupBy(my_sci, function(x){ return x.biome})
        component.setState({'biomes': biomes})
    },
    render: function() {
        var body = this.props.name
        var ordered_biomes = _.chain(this.state.biomes)
            .map(function(v, k){return[v,k]})
            //.sortBy(function(x){return x[1]==body ? '0000' : x[1] }) // Body's main bio goes first
            .value()
        var biomes = _.map(ordered_biomes, function(x){
            var possibleSciences=x[0], biomeName=x[1]
            return (BiomeBox( {biomeName:biomeName, possibleSciences:possibleSciences} ))
        })
        
        var body_width = _.keys(this.state.biomes).length * 88;
        var style = {width: body_width+"px"}
        
        return (
          React.DOM.div( {className:"body", style:style}, 
            biomes
          )
        );
      },
    componentWillMount: function() {
        var component = this
        $(document).on('LOADED_NEW_STUFF', function(){
            component.reload()
        })
        component.reload()
    }
})


var PasteSaveBox = React.createClass({displayName: 'PasteSaveBox',
    handleLoad: function(){
        var contents = this.refs.fileContents.getDOMNode().value.trim();
        load_new_game_save(contents)
        window.scrollTo(0,0);
    },
    render: function() {
        return (React.DOM.div( {className:"pasteSaveBox"}, 
                React.DOM.p(null, "Alternate entry: ", React.DOM.i(null, "Paste in the contents of your KSP save file.")),
                React.DOM.textarea( {ref:"fileContents", rows:"4"}),React.DOM.br(null ),
                React.DOM.input( {type:"submit", value:"LOAD", onClick:this.handleLoad})
            ))
    }
})


React.renderComponent(
  React.DOM.div(null, 
  React.DOM.div( {className:"group"}, 
      PlanetBox( {name:"Kerbol"} ),
      PlanetBox( {name:"Moho"} ),
      PlanetBox( {name:"Eve"}, 
          BodyBox( {name:"Gilly"} )
      ),
      PlanetBox( {name:"Kerbin"} , 
          BodyBox( {name:"Mun"} ),
          BodyBox( {name:"Minmus"} )
      ),
      PlanetBox( {name:"Duna"}, 
          BodyBox( {name:"Ike"} )
      ),
      PlanetBox( {name:"Dres"} ),
      PlanetBox( {name:"Jool"} , 
          BodyBox( {name:"Laythe"} ),
          BodyBox( {name:"Vall"} ),
          BodyBox( {name:"Tylo"} ),
          BodyBox( {name:"Bop"} ),
          BodyBox( {name:"Pol"} )
      ),
      PlanetBox( {name:"Eeloo"} )
  ),
  PasteSaveBox(null)
  )
  ,
  document.getElementById('planets')
);
