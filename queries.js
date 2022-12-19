/*
-----------------------------------------------------------------------------------------------------------
				QUERY INCLUDING MEDICATION, RECEPTOR INTERACTION AND ROLE WITHIN THE BODY
-----------------------------------------------------------------------------------------------------------
*/

let cancers = ['Q33525', 'Q208414', 'Q29496', 'Q223911'] // in order: carcinoma, lymphoma, leukemia, sarcoma

class SPARQLQueryDispatcher {
	constructor( endpoint ) {
		this.endpoint = endpoint;
	}

	query( sparqlQuery ) {
		const fullUrl = this.endpoint + '?query=' + encodeURIComponent( sparqlQuery );
		const headers = { 'Accept': 'application/sparql-results+json' };

		return fetch( fullUrl, { headers } ).then( body => body.json() );
	}
}

const endpointUrl = 'https://query.wikidata.org/sparql';
const sparqlQuery = `SELECT ?item ?itemLabel ?drug ?drugLabel ?role ?roleLabel ?receptor ?receptorLabel
WHERE 
{
  ?item wdt:P279 wd:Q29496. # type of cancer
  ?item wdt:P2176 ?drug. # with treatment (drug)
  ?drug wdt:P2868 ?role  #check for what role the drugs play in the body
  OPTIONAL { ?drug wdt:P129 ?receptor} #check for possible receptor interactions, if any
  
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". } # Helps get the label in your language, if not, then en language
}
`;

const queryDispatcher = new SPARQLQueryDispatcher( endpointUrl );
queryDispatcher.query( sparqlQuery ).then( console.log );
