let cancer;

function displayCancer(){

  cancer = document.activeElement.id;
  document.getElementById("selected-cancer").innerHTML=cancer
  
  console.log(cancer) 
  recreatedataset(cancer)
}

class SPARQLQueryDispatcher {
	constructor( endpoint ) {
		this.endpoint = endpoint;
	}
 //URI(identifies a resource through a name et) vs URL (web adress)
	query( sparqlQuery ) {
		const fullUrl = this.endpoint + '?query=' + encodeURIComponent( sparqlQuery );
		const headers = { 'Accept': 'application/sparql-results+json' };

		return fetch( fullUrl, { headers } ).then( body => body.json() );
	}
}

const endpointUrl = 'https://query.wikidata.org/sparql';


/**
 * 
 */
const sparqlQuery = `
SELECT ?cancer ?cancerLabel  ?drug ?drugLabel ?role ?roleLbl ?receptor ?receptorLbl
WHERE 
{
  VALUES ?cancer {wd:Q33525 wd:Q208414 wd:Q29496 wd:Q223911}
  ?item wdt:P279 ?cancer. # type of cancer
  ?cancer rdfs:label ?cancerLabel.
  ?item wdt:P2176 ?drug. # with treatment (drug)
  ?drug rdfs:label ?drugLabel.
  ?drug wdt:P2868 ?role.  #check for what role the drugs play in the body
  #OPTIONAL { ?drug wdt:P129 ?receptor} #check for possible receptor interactions, if any
  ?drug wdt:P129 ?receptor. #check for possible receptor interactions, if any
  ?receptor rdfs:label ?receptorLabel.
  ?role rdfs:label ?roleLabel.
  FILTER(LANG(?roleLabel) = "en")
  FILTER(LANG(?cancerLabel) = "en")
  FILTER(LANG(?drugLabel) = "en")
  FILTER(LANG(?receptorLabel) = "en")
  BIND(CONCAT(STR(?drugLabel), " - ",STR(?roleLabel)) AS ?roleLbl) 
  BIND(CONCAT(STR(?drugLabel), " - ",STR(?receptorLabel)) AS ?receptorLbl)
  #SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". } # Helps get the label in your language, if not, then en language
  
}
  LIMIT 200

`;

/**
 * creating instance of the class 
 * promise that it is going to return something -> prints to consol.log
 */
const queryDispatcher = new SPARQLQueryDispatcher( endpointUrl );
queryDispatcher.query( sparqlQuery ).then( console.log() );
    

console.log(endpointUrl) ;
console.log();
console.log(sparqlQuery) ;
console.log()
console.log(queryDispatcher.query(sparqlQuery)) ;
console.log() ;
data = queryDispatcher.query(sparqlQuery) ;

function recreatedataset(c){

  data.then(function(result){
    console.log(result) ;
    console.log() ;
    console.log(result.head) ;
    console.log();
    console.log(result.results.bindings) ;
    console.log() ;
    console.log(result.results.bindings[0].receptorLbl.value);
   
    /**
     * 
     */
    var tableData = [];

    console.log("TABLEDATA --> " + tableData);
    tableData.push({"id":c});

    for(var i=0; i<result.results.bindings.length;i++){
      if(result.results.bindings[i].cancerLabel.value==c){
        console.log("found")
        
        tableData.push({"id":result.results.bindings[i].drugLabel.value,"parentId":c })
        tableData.push({"id":result.results.bindings[i].roleLbl.value,"parentId":result.results.bindings[i].drugLabel.value })
        tableData.push({"id":result.results.bindings[i].receptorLbl.value,"parentId":result.results.bindings[i].roleLbl.value }) //if commented out the level will disappear = easier tree
      
        /** puts receptor before role
         *         
        tableData.push({"id":result.results.bindings[i].drugLabel.value,"parentId":c })
        tableData.push({"id":result.results.bindings[i].roleLbl.value,"parentId":result.results.bindings[i].receptorLbl.value })
        tableData.push({"id":result.results.bindings[i].receptorLbl.value,"parentId":result.results.bindings[i].drugLabel.value }) //if commented out the level will disappear = easier tree

         */
      }
    }
    
        console.log(tableData);
        var tableDataClean = [];
        console.log("TABLEDATACLEAN --> " + tableDataClean)

        tableDataClean = tableData.filter((value, index, self) =>
            index === self.findIndex((t) => (
                t.id === value.id && t.parentId === value.parentId
            ))
            )

        console.log(tableDataClean);


        
        document.getElementById("svg").innerHTML = ""; //clear tree everytime a new cancer is selected
        //------START of D3----


        var tableDataFinal = [];
        console.log("TABLEDATAFINAL --> " + tableDataFinal);
        tableDataFinal =  d3.stratify()(tableDataClean); //explain the stratify
        
        console.log(tableDataFinal);
        
            
        /**
         * width = width of radial tree
         * height = height of radial tree
         * transform = needed to move the graph on a 2d plane
         * translate = move based on x and y value : 
         * x = 1000 pixels to the right
         * y = (height/2 + 135) move down
         */
        function radialPoint(x, y) { // 
          return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
        }

        const margin = { left: 90, top: 90, right: 90, bottom: 90 }
        var svg = d3.select("svg"),
        width = 1000 - margin.left - margin.right
        height = 1000 - margin.top - margin.bottom
        g = svg.append("g").attr("transform", "translate(" + width + "," + (height / 2 + margin.top) + ")");

        var tree = d3.tree()
    .size([2 * Math.PI, 250]) // radius of the radial tree
    .separation(function(a, b) { return (a.parent == b.parent ? 1 : 10) / a.depth; }); //defines how far apart the nodes are


    var root = tree(tableDataFinal);

  var link = g.selectAll(".link")
    .data(root.links())
    .enter().append("path")
      .attr("class", "link")
      .attr("d", d3.linkRadial()
          .angle(function(d) { return d.x; })
          .radius(function(d) { return d.y; }));

   var node = g.selectAll(".node")
    .data(root.descendants())
    .enter().append("g")
      .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
      .attr("transform", function(d) { return "translate(" + radialPoint(d.x, d.y) + ")"; }); 

      //default radius of each node
      node.append("circle")
        .attr("r", 5)


        //changes the radius of the node to make it proportional to the number of direct children (not grand children)
        node.select("circle")
    .attr("r", function(d){
         var numKids = 0;
         if (d.children) numKids += d.children.length;
         if (d._children) numKids += d._children.length;
         return 2 * (numKids + 1); //scaling factor * numKids(direct children) + 1(starting radius = 5)
})

      /**
       * .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
       * 
       * defines the direction of the text compared to the node 
       */

   node.append("text")
      .attr("dy", "0.11em")
      .attr("x", function(d) { return d.x < Math.PI === !d.children ? 6 : -6; })
      .attr("text-anchor", function(d) { return d.x < Math.PI === !d.children ? "start" : "end"; })
      .attr("transform", function(d) { return "rotate(" + (d.x < Math.PI ? d.x - Math.PI / 2 : d.x + Math.PI / 2) * 180 / Math.PI + ")"; })
      .text(function(d) { return d.id.substring(d.id.lastIndexOf(".") + 1); });
 
}
) ;
}

